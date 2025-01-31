import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { DonationRefundRequestedEvent } from '../features/donation/domain/events/donation-refund-requested.event';
import { NotificationService } from '../features/notification/notification.service';
import { FindAllAdminsUseCase } from '../features/admin/queries/find-all-admins.usecase';
import { CreateNotificationDto } from '../features/notification/dto/create-notification.dto';
import { NotiType } from '../enums/noti-type.enum';
import { DonationRefundCancelledEvent } from '../features/donation/domain/events/donation-refund-cancelled.event';
import { AdminAssignedForDonationRefundEvent } from '../features/donation/domain/events/admin-assigned-for-refune.event';
import { DonationRefundCompletedEvent } from '../features/donation/domain/events/donation-refund-completed.event';
import { DonationDeletedEvent } from '../features/donation/domain/events/donation-deleted.event';
import { DeleteDepositUseCase } from '../features/deposit/commands/delete-deposit.usecase';
import { DecreaseFundSumUseCase } from '../features/funding/commands/decrease-fundsum.usecase';
import { GiftogetherExceptions } from '../filters/giftogether-exception';
import { InjectRepository } from '@nestjs/typeorm';
import { Donation } from '../entities/donation.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DonationEventHandler {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly findAllAdmins: FindAllAdminsUseCase,
    private readonly deleteDepositUseCase: DeleteDepositUseCase,
    private readonly decreaseFundSumUseCase: DecreaseFundSumUseCase,
    private readonly g2gException: GiftogetherExceptions,
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 후원 환불 요청이 들어왔습니다. 관리자에게 환불 요청 알림을 보냅니다.
   */
  @OnEvent(DonationRefundRequestedEvent.name, { async: true })
  async handleDonationRefundRequested(event: DonationRefundRequestedEvent) {
    const { donId, donorId } = event;

    // !FIXME - 관리자들에게 알림을 일괄적으로 보내는 방법 강구
    this.findAllAdmins.execute().then((admins) => {
      admins.forEach((admin) => {
        const createNotificationDtoForAdmins = new CreateNotificationDto({
          recvId: admin.userId,
          sendId: donorId,
          notiType: NotiType.DonationRefundRequested,
          subId: donId.toString(),
        });

        this.notificationService.createNoti(createNotificationDtoForAdmins);
      });
    });
  }

  /**
   * 후원 환불 요청이 취소되었습니다. 후원자에게 환불 요청 취소 알림을 보냅니다.
   * 만약 관여한 관리자가 있다면 관리자에게도 환불 요청 취소 알림을 보냅니다.
   */
  @OnEvent(DonationRefundCancelledEvent.name, { async: true })
  async handleDonationRefundCancelled(event: DonationRefundCancelledEvent) {
    const { donId, donorId, assignedAdminId } = event;

    const createNotificationDtoForDonor = new CreateNotificationDto({
      recvId: donorId,
      sendId: undefined,
      notiType: NotiType.DonationRefundCancelled,
      subId: donId.toString(),
    });

    this.notificationService.createNoti(createNotificationDtoForDonor);

    if (assignedAdminId) {
      const createNotificationDtoForAdmin = new CreateNotificationDto({
        recvId: assignedAdminId,
        sendId: undefined,
        notiType: NotiType.DonationRefundCancelled,
        subId: donId.toString(),
      });

      this.notificationService.createNoti(createNotificationDtoForAdmin);
    }
  }

  /**
   * 후원 환불 관리자가 할당되었습니다. 관리자에게 환불 요청 알림을 보냅니다.
   */
  @OnEvent(AdminAssignedForDonationRefundEvent.name, { async: true })
  async handleAdminAssignedForDonationRefund(
    event: AdminAssignedForDonationRefundEvent,
  ) {
    const { donId, assignedAdminId } = event;

    const createNotificationDtoForAdmin = new CreateNotificationDto({
      recvId: assignedAdminId,
      sendId: undefined,
      notiType: NotiType.AdminAssignedForDonationRefund,
      subId: donId.toString(),
    });

    this.notificationService.createNoti(createNotificationDtoForAdmin);
  }

  /**
   * 후원 환불이 완료되었습니다. 후원자에게 환불 완료 알림을 보냅니다.
   */
  @OnEvent(DonationRefundCompletedEvent.name, { async: true })
  async handleDonationRefundCompleted(event: DonationRefundCompletedEvent) {
    const { donId, donorId } = event;

    const createNotificationDtoForDonor = new CreateNotificationDto({
      recvId: donorId,
      sendId: undefined,
      notiType: NotiType.DonationRefundCompleted,
      subId: donId.toString(),
    });

    this.notificationService.createNoti(createNotificationDtoForDonor);
  }

  /**
   * 후원이 삭제되었습니다. 후원자에게 후원 삭제 알림을 보냅니다.
   */
  @OnEvent(DonationDeletedEvent.name, { async: true })
  async handleDonationDeleted(event: DonationDeletedEvent) {
    const { donId, donorId } = event;

    const donation = await this.donationRepo.findOne({
      where: { donId },
      withDeleted: true,
    });

    if (!donation) {
      throw this.g2gException.DonationNotExists;
    }

    // 후원자에게 후원 삭제 알림을 보냅니다.
    const createNotificationDtoForDonor = new CreateNotificationDto({
      recvId: donorId,
      sendId: undefined,
      notiType: NotiType.DonationDeleted,
      subId: donId.toString(),
    });

    this.notificationService.createNoti(createNotificationDtoForDonor);
  }
}
