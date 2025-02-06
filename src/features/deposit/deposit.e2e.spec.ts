import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { DepositModule } from './deposit.module';
import { Deposit } from '../../entities/deposit.entity';
import { ProvisionalDonation } from '../../entities/provisional-donation.entity';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { Funding } from 'src/entities/funding.entity';
import { User } from 'src/entities/user.entity';
import { Donation } from 'src/entities/donation.entity';
import { ProvisionalDonationStatus } from 'src/enums/provisional-donation-status.enum';
import { CommonResponse } from 'src/interfaces/common-response.interface';
import { DepositStatus } from 'src/enums/deposit-status.enum';
import { Notification } from 'src/entities/notification.entity';
import { EventModule } from '../event/event.module';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { waitForEventJobs } from 'src/tests/wait-for-events';
import { NotiType } from 'src/enums/noti-type.enum';
import { ProvisionalDonationFsmService } from '../donation/domain/services/provisional-donation-fsm.service';
import {
  createMockUser,
  createMockUserWithRelations,
  createMockDeposit,
  createMockFundingWithRelations,
  createMockProvisionalDonation,
} from '../../tests/mock-factory';
import { FundTheme } from '../../enums/fund-theme.enum';
import { TestAuthBase } from 'src/tests/test-auth-base';
import cookieParser from 'cookie-parser';
import { TestsModule } from 'src/tests/tests.module';
import { MatchDepositUseCase } from './commands/match-deposit.usecase';
import { ProvisionalDonationPartiallyMatchedEvent } from '../donation/domain/events/provisional-donation-partially-matched.event';
import { DonationDeletedEvent } from '../donation/domain/events/donation-deleted.event';
import { Gift } from 'src/entities/gift.entity';

describe('Deposit API E2E Test', () => {
  let app: INestApplication;
  let provDonRepo: Repository<ProvisionalDonation>;
  let userRepo: Repository<User>;
  let fundingRepo: Repository<Funding>;
  let depositRepo: Repository<Deposit>;
  let donationRepo: Repository<Donation>;
  let notiRepo: Repository<Notification>;
  let giftRepo: Repository<Gift>;
  let mockFunding: Funding;
  let mockFundingOwner: User;
  let mockDonor: User;
  let mockAdmin: User;
  let g2gException: GiftogetherExceptions;
  let eventEmitter: EventEmitter2;
  let testAuthBase: TestAuthBase;
  let matchDepositUseCase: MatchDepositUseCase;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DepositModule, EventModule, TestsModule],
      providers: [GiftogetherExceptions, ProvisionalDonationFsmService],
    }).compile();

    app = moduleFixture.createNestApplication();
    provDonRepo = moduleFixture.get(getRepositoryToken(ProvisionalDonation));
    userRepo = moduleFixture.get(getRepositoryToken(User));
    fundingRepo = moduleFixture.get(getRepositoryToken(Funding));
    depositRepo = moduleFixture.get(getRepositoryToken(Deposit));
    donationRepo = moduleFixture.get(getRepositoryToken(Donation));
    notiRepo = moduleFixture.get(getRepositoryToken(Notification));
    giftRepo = moduleFixture.get(getRepositoryToken(Gift));
    g2gException = moduleFixture.get(GiftogetherExceptions);
    eventEmitter = moduleFixture.get<EventEmitter2>(EventEmitter2);
    testAuthBase = await moduleFixture.resolve(TestAuthBase); // REQUEST scoped provider
    matchDepositUseCase = moduleFixture.get(MatchDepositUseCase);
    app.use(cookieParser());
    await app.init();

    mockFundingOwner = await createMockUserWithRelations(
      {
        userRepo,
        fundingRepo,
      },
      {
        userName: '펀딩주인',
      },
      {
        funding: 1,
      },
    );

    mockFunding = mockFundingOwner.fundings[0];

    mockDonor = createMockUser({
      userName: '후원자',
      userEmail: 'mockDonor@example.com',
      userNick: '후원자',
      userPhone: '010-9012-3456',
    } as User);
    await userRepo.insert(mockDonor);

    mockAdmin = createMockUser({
      userName: '관리자',
      userEmail: 'admin@admin.com',
      userNick: '관리자',
      isAdmin: true,
    } as User);
    await userRepo.insert(mockAdmin);

    // create cookies from mockAdmin
    await testAuthBase.login(mockAdmin);

    mockFunding = new Funding(
      mockFundingOwner,
      'mockFunding',
      'mockFunding',
      1_000_000,
      new Date('9999-12-31'),
      FundTheme.Birthday,
      'fundAddrRoad',
      'fundAddrDetl',
      'fundAddrZip',
      'fundRecvName',
      'fundRecvPhone',
    );
    await fundingRepo.insert(mockFunding);
  }, 100000);

  beforeEach(async () => {
    await provDonRepo.delete({});
    await donationRepo.delete({});
    await depositRepo.delete({});
  });

  describe('POST /deposits', () => {
    it('should handle matched deposit', async () => {
      // Create matching provisional donation
      const senderSig = 'POST-1234';
      const provDon = ProvisionalDonation.create(
        g2gException,
        senderSig,
        mockDonor,
        10000,
        mockFunding,
      );
      await provDonRepo.save(provDon);

      await request(app.getHttpServer())
        .post('/deposits')
        .set('Cookie', testAuthBase.cookies)
        .send({
          senderSig,
          receiver: 'GIFTOGETHER',
          amount: 10000,
          transferDate: new Date(),
          depositBank: 'KB',
          depositAccount: '1234-5678',
          withdrawalAccount: '8765-4321',
        })
        .expect(201);

      // 이체내역의 상태가 Matched이어야 합니다.
      const foundDeposits = await depositRepo.find({
        where: { senderSig },
      });
      expect(foundDeposits.length).toBe(1);
      expect(foundDeposits[0].status).toBe(DepositStatus.Matched.toString());

      // Wait until 'deposit.matched.finished'
      await waitForEventJobs(eventEmitter, 'deposit.matched.finished');

      // Provisional Donation의 상태가 Approved이어야 합니다.
      const foundProvDons = await provDonRepo.find({
        where: { senderSig },
      });
      expect(foundProvDons.length).toBe(1);
      expect(foundProvDons[0].status).toBe(ProvisionalDonationStatus.Approved);

      // Donation 하나가 새로 생성되어야 합니다.
      const foundDonations = await donationRepo.find({
        where: {
          user: mockDonor,
        },
      });
      expect(foundDonations.length).toBe(1);
      expect(foundDonations[0].donAmnt).toBe(provDon.amount);

      // Funding 의 fundSum이 수정되어야 합니다.
      const foundFundings = await fundingRepo.find({
        where: { fundId: mockFunding.fundId },
      });
      expect(foundFundings.length).toBe(1);
      expect(foundFundings[0].fundSum).toBe(provDon.amount);

      // Notification이 두개 생성되어야 합니다.
      const foundNotis = await notiRepo.find();
      expect(foundNotis).toHaveLength(2);
      expect(foundNotis).toContainEqual(
        expect.objectContaining({
          notiType: NotiType.DonationSuccess,
        } as Notification),
      );
      expect(foundNotis).toContainEqual(
        expect.objectContaining({
          notiType: NotiType.NewDonate,
        } as Notification),
      );
    });

    it('should handle unmatched deposit', async () => {
      await request(app.getHttpServer())
        .post('/deposits')
        .set('Cookie', testAuthBase.cookies)
        .send({
          senderSig: 'UNKNOWN-1234',
          amount: 10000,
          receiver: 'GIFTOGETHER',
          transferDate: new Date(),
          depositBank: 'KB',
          depositAccount: '1234-5678',
          withdrawalAccount: '8765-4321',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toStrictEqual(
            expect.objectContaining({
              message: g2gException.DepositUnmatched.message,
            } as CommonResponse),
          );
        });

      const foundDeposits = await depositRepo.find({
        where: { senderSig: 'UNKNOWN-1234' },
      });
      expect(foundDeposits).toHaveLength(1);
      expect(foundDeposits[0].status).toBe(DepositStatus.Orphan);
    });

    it('should handle partially matched deposit', async () => {
      // Create provisional donation with different amount
      const provDon = ProvisionalDonation.create(
        g2gException,
        'PARK-1234',
        mockDonor,
        20000,
        mockFunding,
      );
      await provDonRepo.save(provDon);

      await request(app.getHttpServer())
        .post('/deposits')
        .set('Cookie', testAuthBase.cookies)
        .send({
          senderSig: 'PARK-1234',
          amount: 10000,
          receiver: 'GIFTOGETHER',
          transferDate: new Date(),
          depositBank: 'KB',
          depositAccount: '1234-5678',
          withdrawalAccount: '8765-4321',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toStrictEqual(
            expect.objectContaining({
              message: g2gException.DepositPartiallyMatched.message,
            } as CommonResponse),
          );
        });

      await eventEmitter.waitFor(ProvisionalDonationPartiallyMatchedEvent.name);

      const foundProvDon = await provDonRepo.findOne({
        where: { senderSig: 'PARK-1234' },
      });
      expect(foundProvDon.status).toBe(ProvisionalDonationStatus.Rejected);

      const foundDeposit = await depositRepo.findOne({
        where: { senderSig: 'PARK-1234' },
      });
      expect(foundDeposit).not.toBeNull();
      expect(foundDeposit).toHaveProperty(
        'status',
        DepositStatus.PartiallyMatched,
      );
    });
  });

  describe('GET /deposits', () => {
    beforeEach(async () => {
      await depositRepo.delete({});
    });

    it('should return paginated deposits', async () => {
      // Create test deposits using mock factory
      const deposits = await Promise.all(
        Array(3)
          .fill(null)
          .map(() => depositRepo.save(createMockDeposit())),
      );

      const response = await request(app.getHttpServer())
        .get('/deposits')
        .set('Cookie', testAuthBase.cookies)
        .set('Cookie', testAuthBase.cookies)
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.data.deposits).toHaveLength(2);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.lastPage).toEqual(2);

      // Verify deposits are ordered by regAt DESC
      const returnedDeposits = response.body.data.deposits;
      expect(
        new Date(returnedDeposits[0].regAt).getTime(),
      ).toBeGreaterThanOrEqual(new Date(returnedDeposits[1].regAt).getTime());
    });

    it('should return empty array when no deposits exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/deposits')
        .set('Cookie', testAuthBase.cookies)
        .expect(200);

      expect(response.body.data.deposits).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.lastPage).toBe(0);
    });

    it('should handle invalid page parameters', async () => {
      // Create some test deposits
      await Promise.all(
        Array(3)
          .fill(null)
          .map(() => depositRepo.save(createMockDeposit())),
      );

      // Test negative page
      const responseNegative = await request(app.getHttpServer())
        .get('/deposits')
        .set('Cookie', testAuthBase.cookies)
        .query({ page: -1 })
        .expect(400);
      expect(responseNegative.body.message).toBe('잘못된 페이지 번호입니다.');

      // Test page beyond last page
      const responseBeyond = await request(app.getHttpServer())
        .get('/deposits')
        .set('Cookie', testAuthBase.cookies)
        .query({ page: 999 })
        .expect(200);
      expect(responseBeyond.body.data.deposits).toHaveLength(0);
    });
  });

  describe('GET /deposits/:id', () => {
    beforeEach(async () => {
      await depositRepo.delete({});
    });

    it('should return a deposit by id', async () => {
      // Create test deposit using mock factory
      const deposit = await depositRepo.save(createMockDeposit());

      const response = await request(app.getHttpServer())
        .get(`/deposits/${deposit.depositId}`)
        .set('Cookie', testAuthBase.cookies)
        .expect(200);

      expect(response.body.data.depositId).toBe(deposit.depositId);
      expect(response.body.data.senderSig).toBe(deposit.senderSig);
      expect(response.body.data.amount).toBe(deposit.amount);
      expect(response.body.data.receiver).toBe('GIFTOGETHER');
      expect(response.body.data.status).toBe(
        DepositStatus.Unmatched.toString(),
      );
    });

    it('should return 404 when deposit not found', async () => {
      await request(app.getHttpServer())
        .get('/deposits/999999')
        .set('Cookie', testAuthBase.cookies)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe('입금내역을 찾을 수 없습니다.');
        });
    });

    it('should return deposit with related donation if exists', async () => {
      // Create a deposit that is matched with a donation
      const mockFunding = await createMockFundingWithRelations(
        {
          userRepo,
          fundingRepo,
          depositRepo,
          donationRepo,
          giftRepo,
        },
        undefined,
        { deposit: 1, donation: 1, gift: 1 },
      );

      // check if the gift is created
      expect(mockFunding.gifts).toHaveLength(1);

      const deposit = await depositRepo.findOne({
        where: { depositId: mockFunding.donations[0].deposit.depositId },
      });

      const response = await request(app.getHttpServer())
        .get(`/deposits/${deposit.depositId}`)
        .set('Cookie', testAuthBase.cookies)
        .expect(200);

      expect(response.body.data.depositId).toBe(deposit.depositId);
      expect(response.body.data.donation).toBeDefined();
      expect(response.body.data.donation.donAmnt).toBe(deposit.amount);
    });
  });

  describe('DELETE /deposits/:id', () => {
    it('should return 404 when deposit not found', async () => {
      await request(app.getHttpServer())
        .delete('/deposits/999999')
        .set('Cookie', testAuthBase.cookies)
        .expect(404);
    });
    it('should delete deposit if unmatched', async () => {
      const deposit = await depositRepo.save(createMockDeposit());

      await request(app.getHttpServer())
        .delete(`/deposits/${deposit.depositId}`)
        .set('Cookie', testAuthBase.cookies)
        .expect(200);

      const foundDeposit = await depositRepo.findOne({
        where: { depositId: deposit.depositId },
      });
      expect(foundDeposit).toBeNull();
    });
    it('should delete deposit if orphaned', async () => {
      const deposit = await depositRepo.save(
        createMockDeposit({ status: DepositStatus.Orphan }),
      );

      await request(app.getHttpServer())
        .delete(`/deposits/${deposit.depositId}`)
        .set('Cookie', testAuthBase.cookies)
        .expect(200);

      const foundDeposit = await depositRepo.findOne({
        where: { depositId: deposit.depositId },
      });
      expect(foundDeposit).toBeNull();
    });

    it('should change status from rejected to pending of provisional donation', async () => {
      const deposit = await depositRepo.save(
        createMockDeposit({
          status: DepositStatus.Matched,
          amount: 10000,
        }),
      );

      // Create matching provisional donation
      await provDonRepo.save(
        createMockProvisionalDonation({
          senderSig: deposit.senderSig,
          provDonId: mockDonor.userId,
          amount: deposit.amount + 1, // different amount
          funding: mockFunding,
        }),
      );

      // Manually match deposit with provisional donation to change status to Approved
      await expect(matchDepositUseCase.execute(deposit)).rejects.toThrow();

      await request(app.getHttpServer())
        .delete(`/deposits/${deposit.depositId}`)
        .set('Cookie', testAuthBase.cookies)
        .expect(200);

      // Provisional Donation의 상태가 Pending이어야 합니다.
      const foundProvDons = await provDonRepo.find({
        where: { senderSig: deposit.senderSig },
      });
      expect(foundProvDons.length).toBe(1);
      expect(foundProvDons[0].status).toBe(ProvisionalDonationStatus.Pending);

      // Deposit은 삭제되어야 합니다.
      const foundDeposit = await depositRepo.findOne({
        where: { depositId: deposit.depositId },
      });
      expect(foundDeposit).toBeNull();
    });

    it('should delete donation and decrease fundSum and reset to pending on provdon if matched', async () => {
      // Scenario: Create matched deposit, donation, and funding
      const funding = await createMockFundingWithRelations(
        {
          userRepo,
          fundingRepo,
          depositRepo,
          donationRepo,
          provDonRepo,
        },
        {
          fundUser: mockFundingOwner,
        },
        { deposit: 1, donation: 1, provDonation: 1 },
      );

      const donation = funding.donations[0];
      const deposit = donation.deposit;

      await request(app.getHttpServer())
        .delete(`/deposits/${deposit.depositId}`)
        .set('Cookie', testAuthBase.cookies)
        .expect(200);

      await eventEmitter.waitFor(DonationDeletedEvent.name);

      // Funding의 fundSum이 감소되어야 합니다.
      const foundFunding = await fundingRepo.findOne({
        where: { fundId: funding.fundId },
      });
      expect(foundFunding.fundSum).toBe(0);

      // Donation은 삭제되어야 합니다.
      const foundDonation = await donationRepo.findOne({
        where: { donId: donation.donId },
      });
      expect(foundDonation).toBeNull();

      // Provisional Donation의 상태가 Pending이어야 합니다.
      const foundProvDon = await provDonRepo.findOne({
        where: { senderSig: deposit.senderSig },
      });
      expect(foundProvDon.status).toBe(ProvisionalDonationStatus.Pending);
    });
  });

  afterAll(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.destroy();
    await app.close();
  });
});
