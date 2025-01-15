import { Injectable, NotFoundException } from '@nestjs/common';
import { DonationFsmService } from '../services/donation-fsm.service';
import { InjectRepository } from '@nestjs/typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Donation } from '../../../../entities/donation.entity';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DonationRefundRequestedEvent } from './donation-refund-requested.event';
import { GiftogetherExceptions } from '../../../../filters/giftogether-exception';
import { NotificationService } from '../../../notification/notification.service';
import { AdminService } from '../../../admin/admin.service';
import { FindAllAdminsUseCase } from '../../../admin/queries/find-all-admins.usecase';
import { CreateNotificationDto } from '../../../notification/dto/create-notification.dto';
import { NotiType } from '../../../../enums/noti-type.enum';
import { DonationRefundCancelledEvent } from './donation-refund-cancelled.event';
import { AdminAssignedForDonationRefundEvent } from './admin-assigned-for-refune.event';

@Injectable()
export class DonationEventHandler {
  constructor(
    private readonly donationFsmService: DonationFsmService,
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
    private readonly eventEmitter: EventEmitter2,
    private readonly g2gException: GiftogetherExceptions,
    private readonly notificationService: NotificationService,
    private readonly findAllAdmins: FindAllAdminsUseCase,
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
      notiType: NotiType.DonationRefundRequested,
      subId: donId.toString(),
    });

    this.notificationService.createNoti(createNotificationDtoForAdmin);
  }
}
