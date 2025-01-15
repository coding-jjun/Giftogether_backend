import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DonationRefundRequestedEvent } from './donation-refund-requested.event';
import { NotificationService } from '../../../notification/notification.service';
import { FindAllAdminsUseCase } from '../../../admin/queries/find-all-admins.usecase';
import { CreateNotificationDto } from '../../../notification/dto/create-notification.dto';
import { NotiType } from '../../../../enums/noti-type.enum';
import { DonationRefundCancelledEvent } from './donation-refund-cancelled.event';
import { AdminAssignedForDonationRefundEvent } from './admin-assigned-for-refune.event';
import { DonationRefundCompletedEvent } from './donation-refund-completed.event';
import { DonationDeletedEvent } from './donation-deleted.event';
import { DonationDeleteFailedEvent } from './donation-delete-failed.event';
import { DeleteDepositUseCase } from '../../../deposit/commands/delete-deposit.usecase';
import { DecreaseFundSumUseCase } from '../../../funding/commands/decrease-fundsum.usecase';

@Injectable()
export class DonationEventHandler {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly findAllAdmins: FindAllAdminsUseCase,
    private readonly deleteDepositUseCase: DeleteDepositUseCase,
    private readonly decreaseFundSumUseCase: DecreaseFundSumUseCase,
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
   *
   * [정책]
   * 삭제된 후원은 이체내역도 함께 삭제시킨다
   *
   * [정책]
   * 삭제된 후원 펀딩금액을 감액 시킨다
   */
  @OnEvent(DonationDeletedEvent.name, { async: true })
  async handleDonationDeleted(event: DonationDeletedEvent) {
    const { donId, donorId, fundId, adminId } = event;

    // 후원자에게 후원 삭제 알림을 보냅니다.
    const createNotificationDtoForDonor = new CreateNotificationDto({
      recvId: donorId,
      sendId: undefined,
      notiType: NotiType.DonationDeleted,
      subId: donId.toString(),
    });

    this.notificationService.createNoti(createNotificationDtoForDonor);

    // 관리자에게 후원 삭제 알림을 보냅니다.
    const createNotificationDtoForAdmin = new CreateNotificationDto({
      recvId: adminId,
      sendId: undefined,
      notiType: NotiType.DonationDeleted,
      subId: donId.toString(),
    });

    this.notificationService.createNoti(createNotificationDtoForAdmin);

    // 이체내역 삭제
    const deletedDeposit = await this.deleteDepositUseCase.execute(donId);

    // 펀딩금액 감액
    await this.decreaseFundSumUseCase.execute({
      fundId,
      amount: deletedDeposit.amount,
    });
  }

  /**
   * 후원 삭제가 실패했습니다. 후원자와 관리자에게 후원 삭제 실패 알림을 보냅니다.
   */
  @OnEvent(DonationDeleteFailedEvent.name, { async: true })
  async handleDonationDeleteFailed(event: DonationDeleteFailedEvent) {
    const { donId, donorId, adminId } = event;

    const createNotificationDtoForDonor = new CreateNotificationDto({
      recvId: donorId,
      sendId: undefined,
      notiType: NotiType.DonationDeleteFailed,
      subId: donId.toString(),
    });

    this.notificationService.createNoti(createNotificationDtoForDonor);

    const createNotificationDtoForAdmin = new CreateNotificationDto({
      recvId: adminId,
      sendId: undefined,
      notiType: NotiType.DonationDeleteFailed,
      subId: donId.toString(),
    });

    this.notificationService.createNoti(createNotificationDtoForAdmin);
  }
}
