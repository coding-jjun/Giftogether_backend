import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Deposit } from '../entities/deposit.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GiftogetherExceptions } from '../filters/giftogether-exception';
import { MatchedDepositDeleteRequestedEvent } from '../features/deposit/domain/events/matched-deposit-delete-requested.event';
import { PartiallyMatchedDepositDeleteRequestedEvent } from '../features/deposit/domain/events/partially-matched-deposit-delete-requested.event';
import { DeleteDonationUseCase } from '../features/donation/commands/delete-donation.usecase';
import { DonationDeletedEvent } from '../features/donation/domain/events/donation-deleted.event';
import { ProvisionalDonationMatchCancelledEvent } from '../features/donation/domain/events/provisional-donation-match-cancelled.event';
import { CancelMatchProvisionalDonationUseCase } from 'src/features/donation/commands/cancel-match-provisional-donation.usecase';
import { NotificationService } from 'src/features/notification/notification.service';
import { CreateNotificationDto } from 'src/features/notification/dto/create-notification.dto';
import { NotiType } from 'src/enums/noti-type.enum';
import { DeleteDepositUseCase } from '../features/deposit/commands/delete-deposit.usecase';
import { InvalidStatus } from 'src/exceptions/invalid-status';
import { DepositDeletedEvent } from '../features/deposit/domain/events/deposit-deleted.event';

@Injectable()
export class DepositDeleteSaga {
  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,
    private readonly g2gException: GiftogetherExceptions,
    private readonly deleteDonation: DeleteDonationUseCase,
    private readonly deleteDeposit: DeleteDepositUseCase,
    private readonly cancelMatchProvDon: CancelMatchProvisionalDonationUseCase,
    private readonly notiService: NotificationService,
  ) {}

  /**
   * 후원이 정상적으로 처리되어 연관된 후원을 먼저 제거해야 합니다. 이 프로세스는 후원 삭제 성공 여부에 따라 실패할 수 있는 프로세스로, 예외 발생시 적절한 보상조치를 수행합니다.
   */
  @OnEvent(MatchedDepositDeleteRequestedEvent.name, { async: true })
  async handleMatchedDepositDeleteRequested(
    event: MatchedDepositDeleteRequestedEvent,
  ) {
    const { depositId, adminId } = event;

    const deposit = await this.depositRepository.findOne({
      where: { depositId },
      relations: { donation: true },
    });

    if (!deposit) {
      throw this.g2gException.DepositNotFound;
    }

    // 후원 삭제 프로세스, 실패할 수 있음.
    try {
      await this.deleteDonation.execute(
        deposit.donation.donId,
        adminId,
        depositId,
      );
    } catch (error) {
      /**
       * 후원 삭제에 실패함! 보상절차를 시작합니다.
       */
      if (error instanceof InvalidStatus) {
        const notiDto = new CreateNotificationDto({
          recvId: adminId,
          sendId: undefined,
          notiType: NotiType.DonationDeleteFailed,
          subId: deposit.donation.donId.toString(),
        });
        await this.notiService.createNoti(notiDto);
      } else {
        throw error;
      }
    }
  }

  /**
   * 연관 예비후원의 상태를 초기화한 뒤 이체내역을 삭제합니다.
   */
  @OnEvent(PartiallyMatchedDepositDeleteRequestedEvent.name, { async: true })
  async handlePartiallyMatchedDepositDeleteRequested(
    event: PartiallyMatchedDepositDeleteRequestedEvent,
  ) {
    const { depositId, senderSig, adminId } = event;

    // 예비후원 매치 취소
    try {
      await this.cancelMatchProvDon.execute(senderSig, depositId, adminId);
    } catch (error) {
      if (error instanceof InvalidStatus) {
        // 예비후원 매치 취소 실패! 보상 절차를 진행합니다
        // send notification to admin
        const notiDto = new CreateNotificationDto({
          recvId: adminId,
          sendId: undefined,
          notiType: NotiType.ProvisionalDonationMatchCancelFailed,
          subId: event.senderSig,
        });
        await this.notiService.createNoti(notiDto);
      } else {
        throw error;
      }
    }
  }

  /**
   * 후원 삭제 성공 시 처리
   *
   * 관리자에게 후원 삭제 알림을 보내고 이체내역을 삭제한다.
   */
  @OnEvent(DonationDeletedEvent.name, { async: true })
  async handleDonationDeleted(event: DonationDeletedEvent) {
    const { donId, adminId, depositId } = event;

    // 관리자에게 후원 삭제 알림을 보냅니다.
    const createNotificationDtoForAdmin = new CreateNotificationDto({
      recvId: adminId,
      sendId: undefined,
      notiType: NotiType.DonationDeleted,
      subId: donId.toString(),
    });

    await this.notiService.createNoti(createNotificationDtoForAdmin);

    // 마참내..! 이체내역 삭제 💀
    await this.deleteDeposit.execute(depositId, adminId);
  }

  /**
   * 예비 후원 매치 취소 성공시 처리
   */
  @OnEvent(ProvisionalDonationMatchCancelledEvent.name, { async: true })
  async handleProvDonMatchCancelled(
    event: ProvisionalDonationMatchCancelledEvent,
  ) {
    const { depositId, adminId } = event;
    const deposit = await this.depositRepository.findOne({
      where: { depositId },
    });
    if (!deposit) {
      throw this.g2gException.DepositNotFound;
    }
    await this.deleteDeposit.execute(deposit.depositId, adminId);
  }

  /**
   * 이체내역을 성공적으로 삭제했습니다. 관리자에게 알림을 보냅니다.
   */
  @OnEvent(DepositDeletedEvent.name, { async: true })
  async handleDepositDeleted(event: DepositDeletedEvent) {
    const { depositId, adminId } = event;

    const notiDto = new CreateNotificationDto({
      recvId: adminId,
      sendId: undefined,
      notiType: NotiType.DepositDeleted,
      subId: depositId.toString(),
    });
    await this.notiService.createNoti(notiDto);
  }
}
