import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DonationRefundRequestedEvent } from 'src/features/donation/domain/events/donation-refund-requested.event';
import { NotificationService } from 'src/features/notification/notification.service';
import { FindAllAdminsUseCase } from 'src/features/admin/queries/find-all-admins.usecase';
import { CreateNotificationDto } from 'src/features/notification/dto/create-notification.dto';
import { NotiType } from 'src/enums/noti-type.enum';
import { DonationRefundCancelledEvent } from 'src/features/donation/domain/events/donation-refund-cancelled.event';
import { AdminAssignedForDonationRefundEvent } from 'src/features/donation/domain/events/admin-assigned-for-refune.event';
import { DonationRefundCompletedEvent } from 'src/features/donation/domain/events/donation-refund-completed.event';
import { DonationDeletedEvent } from 'src/features/donation/domain/events/donation-deleted.event';
import { Notification } from 'src/entities/notification.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';

@Injectable()
export class DonationEventHandler {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly findAllAdmins: FindAllAdminsUseCase,

    @InjectRepository(Notification)
    private notiRepository: Repository<Notification>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 후원 환불 요청이 들어왔습니다. 관리자에게 환불 요청 알림을 보냅니다.
   */
  @OnEvent(DonationRefundRequestedEvent.name, { async: true })
  async handleDonationRefundRequested(event: DonationRefundRequestedEvent) {
    const { donId, donorId } = event;

    // !FIXME - 관리자들에게 알림을 일괄적으로 보내는 방법 강구
    this.findAllAdmins.execute().then((admins) => {
      admins.forEach(async (admin) => {
        const createNotificationDtoForAdmins = new CreateNotificationDto({
          recvId: admin.userId,
          sendId: donorId,
          notiType: NotiType.DonationRefundRequested,
          subId: donId.toString(),
        });

        await this.notificationService.createNoti(
          createNotificationDtoForAdmins,
        );
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

    await this.notificationService.createNoti(createNotificationDtoForDonor);

    if (assignedAdminId) {
      const createNotificationDtoForAdmin = new CreateNotificationDto({
        recvId: assignedAdminId,
        sendId: undefined,
        notiType: NotiType.DonationRefundCancelled,
        subId: donId.toString(),
      });

      await this.notificationService.createNoti(createNotificationDtoForAdmin);
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

    await this.notificationService.createNoti(createNotificationDtoForAdmin);
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

    await this.notificationService.createNoti(createNotificationDtoForDonor);
  }

  /**
   * 후원이 삭제되었습니다. 후원자에게 후원 삭제 알림을 보냅니다.
   */
  @OnEvent(DonationDeletedEvent.name, { async: true })
  async handleDonationDeleted(event: DonationDeletedEvent) {
    const { donId, donorId } = event;

    // 후원자에게 후원 삭제 알림을 보냅니다.
    const createNotificationDtoForDonor = new CreateNotificationDto({
      recvId: donorId,
      sendId: undefined,
      notiType: NotiType.DonationDeleted,
      subId: donId.toString(),
    });

    await this.notificationService.createNoti(createNotificationDtoForDonor);
  }

  /** 
   * 새로운 후원이 추가되었을 때, 펀딩 게시시자에게 알림을 보냅니다.
   */
  @OnEvent('NewDonate')
  async handleNewDonate(data: {recvId: number, sendId: number, subId: string}) {
    const noti = new Notification();
    const receiver = await this.userRepository.findOneBy({ userId: data.recvId })
    const sender = await this.userRepository.findOneBy({ userId: data.sendId })
    
    noti.sendId = sender;
    noti.recvId = receiver;
    noti.notiType = NotiType.NewDonate;
    noti.subId = data.subId;
  
    return await this.notiRepository.save(noti);
  }
}
