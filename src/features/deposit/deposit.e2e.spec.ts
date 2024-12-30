import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createDataSourceOptions } from 'src/tests/data-source-options';
import { DepositModule } from './deposit.module';
import { Deposit } from './domain/entities/deposit.entity';
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
import { CommonResponse } from 'src/interfaces/common-response.interface';
import { DepositStatus } from 'src/enums/deposit-status.enum';
import { Notification } from 'src/entities/notification.entity';
import { EventModule } from '../event/event.module';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { waitForEventJobs } from 'src/tests/wait-for-events';
import { NotiType } from 'src/enums/noti-type.enum';
import { DonationStatus } from 'src/enums/donation-status.enum';

const entities = [
  Deposit,
  User,
  Account,
  Comment,
  Address,
  Image,
  Gift,
  Donation,
  Funding,
  Notification,
];

describe('Deposit API E2E Test', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let fundingRepo: Repository<Funding>;
  let depositRepo: Repository<Deposit>;
  let donationRepo: Repository<Donation>;
  let notiRepo: Repository<Notification>;
  let mockFunding: Funding;
  let mockFundingOwner: User;
  let mockDonor: User;
  let mockDonation: Donation;
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
      providers: [GiftogetherExceptions],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepo = moduleFixture.get(getRepositoryToken(User));
    fundingRepo = moduleFixture.get(getRepositoryToken(Funding));
    depositRepo = moduleFixture.get(getRepositoryToken(Deposit));
    donationRepo = moduleFixture.get(getRepositoryToken(Donation));
    notiRepo = moduleFixture.get(getRepositoryToken(Notification));
    g2gException = moduleFixture.get(GiftogetherExceptions);
    eventEmitter = moduleFixture.get<EventEmitter2>(EventEmitter2);
    mockFundingOwner = new User();

    mockFundingOwner = await userRepo.save({
      userId: 1,
      userName: '펀딩주인',
    } as User);

    mockDonor = await userRepo.save({
      userId: 2,
      userName: '후원자',
    } as User);

    mockFunding = await fundingRepo.save({
      fundId: 1,
      fundUser: mockFundingOwner,
      fundTitle: '나에게 공물을 바쳐라',
      fundCont: '부와악을 울려라',
      fundGoal: 100000,
      fundAddrRoad: '',
      fundAddrDetl: '',
      fundAddrZip: '',
      fundRecvName: '',
      fundRecvPhone: '',
      endAt: new Date('9999-12-31'),
    } as Funding);

    mockDonation = await donationRepo.save({
      donId: 1,
      funding: mockFunding,
      user: mockDonor,
      deposit: null, // 아직은 없는 상태
      orderId: '123-456-789',
      donAmnt: 10000,
      expirationDate: new Date(),
      senderSig: '후원자-12',
    } as Donation);
  });

  beforeEach(async () => {
    await depositRepo.delete({});
  });

  it('should succesfully create mock entities (funding, user)', async () => {
    const foundUsers = await userRepo.find({});
    expect(foundUsers).toHaveLength(2);

    const foundFundings = await fundingRepo.find({});
    expect(foundFundings).toHaveLength(1);

    const foundDonations = await donationRepo.find({});
    expect(foundDonations).toHaveLength(1);
  });

  describe('POST /deposits', () => {
    it('should handle matched deposit', async () => {
      const senderSig = '후원자-12';
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

      // Donation 상태가 Approved가 되어야 합니다.
      const foundDonations = await donationRepo.find({
        where: {
          donId: mockDonation.donId,
        },
      });
      expect(foundDonations).toHaveLength(1);
      expect(foundDonations[0].status).toBe(DonationStatus.Approved.toString());

      // Funding 의 fundSum이 수정되어야 합니다.
      const foundFundings = await fundingRepo.find({
        where: { fundId: mockFunding.fundId },
      });
      expect(foundFundings.length).toBe(1);
      expect(foundFundings[0].fundSum).toBe(mockDonation.donAmnt);

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
    });
  });

  afterAll(async () => {
    // 테스트 데이터베이스를 DROP하는 명령어. 모든 테이블과 데이터가 사라집니다!! 💀
    await app.get(DataSource).dropDatabase();
    await app.close();
  });
});
