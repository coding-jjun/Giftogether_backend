import { Test, TestingModule } from '@nestjs/testing';
import { DonationEventHandler } from './donation-event-handler';
import { Donation } from '../entities/donation.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GiftogetherExceptions } from '../filters/giftogether-exception';
import { NotificationService } from '../features/notification/notification.service';
import { FindAllAdminsUseCase } from '../features/admin/queries/find-all-admins.usecase';
import { DeleteDepositUseCase } from '../features/deposit/commands/delete-deposit.usecase';
import { DecreaseFundSumUseCase } from '../features/funding/commands/decrease-fundsum.usecase';
import { DonationRefundRequestedEvent } from '../features/donation/domain/events/donation-refund-requested.event';
import { DonationRefundCancelledEvent } from '../features/donation/domain/events/donation-refund-cancelled.event';
import { AdminAssignedForDonationRefundEvent } from '../features/donation/domain/events/admin-assigned-for-refune.event';
import { DonationRefundCompletedEvent } from '../features/donation/domain/events/donation-refund-completed.event';
import { DonationDeletedEvent } from '../features/donation/domain/events/donation-deleted.event';
import { DonationDeleteFailedEvent } from '../features/donation/domain/events/donation-delete-failed.event';
import { NotiType } from '../enums/noti-type.enum';
import { User } from '../entities/user.entity';
import { createMockProvider } from '../tests/create-mock-repository';
import {
  createMockUser,
  createMockDeposit,
} from '../tests/mock-factory';
import { Notification } from '../entities/notification.entity';
import { Funding } from '../entities/funding.entity';
import { Deposit } from '../entities/deposit.entity';
import { DepositFsmService } from '../features/deposit/domain/deposit-fsm.service';
import { DepositDto } from '../features/deposit/dto/deposit.dto';
describe('DonationEventHandler', () => {
  let handler: DonationEventHandler;
  let notificationService: NotificationService;
  let findAllAdmins: FindAllAdminsUseCase;
  let deleteDepositUseCase: DeleteDepositUseCase;
  let decreaseFundSumUseCase: DecreaseFundSumUseCase;
  let mockUser: User;
  let mockAdmin1: User;
  let mockAdmin2: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonationEventHandler,
        NotificationService,
        FindAllAdminsUseCase,
        DeleteDepositUseCase,
        DepositFsmService,
        DecreaseFundSumUseCase,
        GiftogetherExceptions,
        EventEmitter2,
        createMockProvider(Notification),
        createMockProvider(User),
        createMockProvider(Funding),
        createMockProvider(Donation),
        createMockProvider(Deposit),
      ],
    }).compile();

    handler = module.get<DonationEventHandler>(DonationEventHandler);
    notificationService = module.get<NotificationService>(NotificationService);
    findAllAdmins = module.get<FindAllAdminsUseCase>(FindAllAdminsUseCase);
    deleteDepositUseCase =
      module.get<DeleteDepositUseCase>(DeleteDepositUseCase);
    decreaseFundSumUseCase = module.get<DecreaseFundSumUseCase>(
      DecreaseFundSumUseCase,
    );

    mockUser = createMockUser({ userId: 1 });
    mockAdmin1 = createMockUser({ userId: 2, isAdmin: true });
    mockAdmin2 = createMockUser({ userId: 3, isAdmin: true });
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handleDonationRefundRequested', () => {
    it('should send notifications to all admins', async () => {
      const event = new DonationRefundRequestedEvent(1, mockUser.userId);
      const mockAdmins = [mockAdmin1, mockAdmin2];

      jest.spyOn(findAllAdmins, 'execute').mockResolvedValue(mockAdmins);
      const notiSpy = jest.spyOn(notificationService, 'createNoti');

      await handler.handleDonationRefundRequested(event);

      expect(findAllAdmins.execute).toHaveBeenCalled();
      expect(notiSpy).toHaveBeenCalledTimes(mockAdmins.length);
      mockAdmins.forEach((admin) => {
        expect(notiSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            recvId: admin.userId,
            sendId: mockUser.userId,
            notiType: NotiType.DonationRefundRequested,
            subId: event.donId.toString(),
          }),
        );
      });
    });
  });

  describe('handleDonationRefundCancelled', () => {
    it('should send notification to donor only when no admin is assigned', async () => {
      const event = new DonationRefundCancelledEvent(1, mockUser.userId);
      const notiSpy = jest.spyOn(notificationService, 'createNoti');

      await handler.handleDonationRefundCancelled(event);

      expect(notiSpy).toHaveBeenCalledTimes(1);
      expect(notiSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          recvId: mockUser.userId,
          notiType: NotiType.DonationRefundCancelled,
          subId: event.donId.toString(),
        }),
      );
    });

    it('should send notifications to both donor and admin when admin is assigned', async () => {
      const event = new DonationRefundCancelledEvent(
        1,
        mockUser.userId,
        mockAdmin1.userId,
      );
      const notiSpy = jest.spyOn(notificationService, 'createNoti');

      await handler.handleDonationRefundCancelled(event);

      expect(notiSpy).toHaveBeenCalledTimes(2);
      expect(notiSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          recvId: mockUser.userId,
          notiType: NotiType.DonationRefundCancelled,
          subId: event.donId.toString(),
        }),
      );
      expect(notiSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          recvId: mockAdmin1.userId,
          notiType: NotiType.DonationRefundCancelled,
          subId: event.donId.toString(),
        }),
      );
    });
  });

  describe('handleAdminAssignedForDonationRefund', () => {
    it('should send notification to assigned admin', async () => {
      const event = new AdminAssignedForDonationRefundEvent(
        1,
        mockAdmin1.userId,
      );
      const notiSpy = jest.spyOn(notificationService, 'createNoti');

      await handler.handleAdminAssignedForDonationRefund(event);

      expect(notiSpy).toHaveBeenCalledTimes(1);
      expect(notiSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          recvId: mockAdmin1.userId,
          notiType: NotiType.AdminAssignedForDonationRefund,
          subId: event.donId.toString(),
        }),
      );
    });
  });

  describe('handleDonationRefundCompleted', () => {
    it('should send notification to donor', async () => {
      const event = new DonationRefundCompletedEvent(1, mockUser.userId);
      const notiSpy = jest.spyOn(notificationService, 'createNoti');

      await handler.handleDonationRefundCompleted(event);

      expect(notiSpy).toHaveBeenCalledTimes(1);
      expect(notiSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          recvId: mockUser.userId,
          notiType: NotiType.DonationRefundCompleted,
          subId: event.donId.toString(),
        }),
      );
    });
  });

  describe('handleDonationDeleted', () => {
    it('should send notifications and handle deposit deletion and fund sum decrease', async () => {
      const mockDeposit = createMockDeposit();
      const event = new DonationDeletedEvent(
        1,
        mockUser.userId,
        3,
        mockDeposit.depositId,
        mockAdmin1.userId,
      );

      const notiSpy = jest.spyOn(notificationService, 'createNoti');
      const deleteDepositSpy = jest
        .spyOn(deleteDepositUseCase, 'execute')
        .mockResolvedValue(new DepositDto(mockDeposit));
      const decreaseFundSumSpy = jest.spyOn(decreaseFundSumUseCase, 'execute');

      await handler.handleDonationDeleted(event);

      expect(notiSpy).toHaveBeenCalledTimes(2);
      expect(notiSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          recvId: mockUser.userId,
          notiType: NotiType.DonationDeleted,
          subId: event.donId.toString(),
        }),
      );
      expect(notiSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          recvId: mockAdmin1.userId,
          notiType: NotiType.DonationDeleted,
          subId: event.donId.toString(),
        }),
      );

      expect(deleteDepositSpy).toHaveBeenCalledWith(event.donId);
      expect(decreaseFundSumSpy).toHaveBeenCalledWith({
        fundId: event.fundId,
        amount: mockDeposit.amount,
      });
    });
  });
});
