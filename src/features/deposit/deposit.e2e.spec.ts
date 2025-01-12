import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createDataSourceOptions } from 'src/tests/data-source-options';
import { DepositModule } from './deposit.module';
import { Deposit } from '../../entities/deposit.entity';
import { ProvisionalDonation } from '../../entities/provisional-donation.entity';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { Funding } from 'src/entities/funding.entity';
import { User } from 'src/entities/user.entity';
import { AuthType } from 'src/enums/auth-type.enum';
import { Account } from 'src/entities/account.entity';
import { Comment } from 'src/entities/comment.entity';
import { Address } from 'src/entities/address.entity';
import { Image } from 'src/entities/image.entity';
import { Gift } from 'src/entities/gift.entity';
import { Donation } from 'src/entities/donation.entity';
import { FundTheme } from 'src/enums/fund-theme.enum';
import { ProvisionalDonationStatus } from 'src/enums/provisional-donation-status.enum';
import { CommonResponse } from 'src/interfaces/common-response.interface';
import { DepositStatus } from 'src/enums/deposit-status.enum';
import { Notification } from 'src/entities/notification.entity';
import { EventModule } from '../event/event.module';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { waitForEventJobs } from 'src/tests/wait-for-events';
import { NotiType } from 'src/enums/noti-type.enum';
import { CsBoard } from 'src/entities/cs-board.entity';
import { CsComment } from 'src/entities/cs-comment.entity';
import { ProvisionalDonationApprovedEvent } from '../donation/domain/events/provisional-donation-approved.event';
import { DonationModule } from '../donation/donation.module';
import { NotificationModule } from '../notification/notification.module';
import { NotificationService } from '../notification/notification.service';
import { ProvisionalDonationEventHandler } from '../donation/domain/events/provisional-donation-event-handler';
import { ProvisionalDonationFsmService } from '../donation/domain/services/provisional-donation-fsm.service';
import { AuthModule } from '../auth/auth.module';
import { ConfigService } from '@nestjs/config';

const entities = [
  Deposit,
  ProvisionalDonation,
  User,
  Account,
  Comment,
  Address,
  Image,
  Gift,
  Donation,
  Funding,
  Notification,
  CsBoard,
  CsComment,
];

describe('Deposit API E2E Test', () => {
  let app: INestApplication;
  let provDonRepo: Repository<ProvisionalDonation>;
  let userRepo: Repository<User>;
  let fundingRepo: Repository<Funding>;
  let depositRepo: Repository<Deposit>;
  let donationRepo: Repository<Donation>;
  let notiRepo: Repository<Notification>;
  let mockFunding: Funding;
  let mockFundingOwner: User;
  let mockDonor: User;
  let g2gException: GiftogetherExceptions;
  let eventEmitter: EventEmitter2;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(createDataSourceOptions(entities)),
        TypeOrmModule.forFeature(entities),
        DepositModule,
        EventModule,
      ],
      providers: [
        GiftogetherExceptions,
        NotificationService,
        ProvisionalDonationEventHandler,
        ProvisionalDonationFsmService,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    provDonRepo = moduleFixture.get(getRepositoryToken(ProvisionalDonation));
    userRepo = moduleFixture.get(getRepositoryToken(User));
    fundingRepo = moduleFixture.get(getRepositoryToken(Funding));
    depositRepo = moduleFixture.get(getRepositoryToken(Deposit));
    donationRepo = moduleFixture.get(getRepositoryToken(Donation));
    notiRepo = moduleFixture.get(getRepositoryToken(Notification));
    g2gException = moduleFixture.get(GiftogetherExceptions);
    eventEmitter = moduleFixture.get<EventEmitter2>(EventEmitter2);
    await app.init();

    mockFundingOwner = new User();
    Object.assign(mockFundingOwner, {
      authId: 'mockUser',
      authType: AuthType.Jwt,
      userNick: 'mockUser',
      userPw: 'password',
      userName: '펀딩주인',
      userPhone: '010-1234-5678',
      userBirth: new Date('1997-09-26'),
      account: null,
      regAt: new Date(Date.now()),
      uptAt: new Date(Date.now()),
      delAt: null,
      userEmail: 'mockFundingOwner@example.com',
      defaultImgId: undefined,
      createdImages: [],
      image: null,
      isAdmin: false,
    });
    await userRepo.insert(mockFundingOwner);

    mockDonor = Object.create(mockFundingOwner) as User;
    Object.assign(mockDonor, {
      userName: '후원자',
      userEmail: 'mockDonor@example.com',
      userNick: '후원자',
      userPhone: '010-9012-3456',
    } as User);
    await userRepo.insert(mockDonor);

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
      const senderSig = 'HONG-1234';
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
      expect(foundProvDons[0].status).toBe(
        ProvisionalDonationStatus.Approved,
      );

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

      const foundDeposits = await depositRepo.find();
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

      const foundProvDon = await provDonRepo.findOne({
        where: { senderSig: 'PARK-1234' },
      });
      expect(foundProvDon.status).toBe(
        ProvisionalDonationStatus.Rejected.toString(),
      );
    });
  });

  afterAll(async () => {
    // 테스트 데이터베이스를 DROP하는 명령어. 모든 테이블과 데이터가 사라집니다!! 💀
    await app.get(DataSource).dropDatabase();
    await app.close();
  });
});
