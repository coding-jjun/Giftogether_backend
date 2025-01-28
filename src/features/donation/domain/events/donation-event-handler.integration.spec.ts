import { Test, TestingModule } from '@nestjs/testing';
import { DonationEventHandler } from './donation-event-handler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationService } from '../../../notification/notification.service';
import { FindAllAdminsUseCase } from '../../../admin/queries/find-all-admins.usecase';
import { DeleteDepositUseCase } from '../../../deposit/commands/delete-deposit.usecase';
import { DecreaseFundSumUseCase } from '../../../funding/commands/decrease-fundsum.usecase';
import { DonationRefundRequestedEvent } from './donation-refund-requested.event';
import { DonationRefundCancelledEvent } from './donation-refund-cancelled.event';
import { DonationDeletedEvent } from './donation-deleted.event';
import { User } from '../../../../entities/user.entity';
import { Notification } from '../../../../entities/notification.entity';
import { Funding } from '../../../../entities/funding.entity';
import { Donation } from '../../../../entities/donation.entity';
import { Deposit } from '../../../../entities/deposit.entity';
import { DataSource, Repository } from 'typeorm';
import { GiftogetherExceptions } from '../../../../filters/giftogether-exception';
import { DepositFsmService } from '../../../deposit/domain/deposit-fsm.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  createMockUser,
  createMockDeposit,
  createMockFunding,
  createMockDonation,
} from '../../../../tests/mock-factory';
import { createDataSourceOptions } from '../../../../tests/data-source-options';
import entities from '../../../../entities/entities';

describe('DonationEventHandler (Integration)', () => {
  let module: TestingModule;
  let handler: DonationEventHandler;
  let userRepo: Repository<User>;
  let fundingRepo: Repository<Funding>;
  let donationRepo: Repository<Donation>;
  let depositRepo: Repository<Deposit>;
  let notificationRepo: Repository<Notification>;
  let mockUser: User;
  let mockAdmin1: User;
  let mockAdmin2: User;
  let mockFunding: Funding;
  let mockDonation: Donation;
  let mockDeposit: Deposit;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(createDataSourceOptions(entities)),
        TypeOrmModule.forFeature(entities),
        EventEmitterModule.forRoot(),
      ],
      providers: [
        DonationEventHandler,
        NotificationService,
        FindAllAdminsUseCase,
        DeleteDepositUseCase,
        DepositFsmService,
        DecreaseFundSumUseCase,
        GiftogetherExceptions,
      ],
    }).compile();

    handler = module.get<DonationEventHandler>(DonationEventHandler);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    fundingRepo = module.get<Repository<Funding>>(getRepositoryToken(Funding));
    donationRepo = module.get<Repository<Donation>>(
      getRepositoryToken(Donation),
    );
    depositRepo = module.get<Repository<Deposit>>(getRepositoryToken(Deposit));
    notificationRepo = module.get<Repository<Notification>>(
      getRepositoryToken(Notification),
    );
    dataSource = module.get(DataSource);

    // Create test data
    mockUser = await userRepo.save(createMockUser({ userId: 1 }));
    mockAdmin1 = await userRepo.save(
      createMockUser({ userId: 2, isAdmin: true }),
    );
    mockAdmin2 = await userRepo.save(
      createMockUser({ userId: 3, isAdmin: true }),
    );
    mockFunding = await fundingRepo.save(
      createMockFunding({ fundUser: mockUser }),
    );
    // create mock deposit
    mockDeposit = await depositRepo.save(createMockDeposit());
    // create mock donation
    mockDonation = await donationRepo.save(
      createMockDonation({
        user: mockUser,
        funding: mockFunding,
        deposit: mockDeposit,
      }),
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  describe('handleDonationRefundRequested (Integration)', () => {
    it('should create notifications for all admins in the database', async () => {
      const event = new DonationRefundRequestedEvent(
        mockDonation.donId,
        mockUser.userId,
      );
      await handler.handleDonationRefundRequested(event);

      // !FIXME - 알림 테스트는 Notification 모듈에서 진행
      // const notifications = await notificationRepo.find({
      //   where: {
      //     notiType: NotiType.DonationRefundRequested,
      //     subId: mockDonation.donId.toString(),
      //   },
      // });
      // expect(notifications).toHaveLength(2); // One for each admin
      // expect(notifications[0].recvId).toBe(mockAdmin1.userId);
      // expect(notifications[1].recvId).toBe(mockAdmin2.userId);
    });
  });

  describe('handleDonationRefundCancelled (Integration)', () => {
    it('should create notifications for both donor and admin', async () => {
      const event = new DonationRefundCancelledEvent(
        mockDonation.donId,
        mockUser.userId,
        mockAdmin1.userId,
      );

      await handler.handleDonationRefundCancelled(event);

      // !FIXME - 알림 테스트는 Notification 모듈에서 진행
      // const notifications = await notificationRepo.find({
      //   where: {
      //     notiType: NotiType.DonationRefundCancelled,
      //     subId: mockDonation.donId.toString(),
      //   },
      // });

      // expect(notifications).toHaveLength(2);
      // expect(notifications.map((n) => n.recvId)).toContain(mockUser.userId);
      // expect(notifications.map((n) => n.recvId)).toContain(mockAdmin1.userId);
    });
  });
});
