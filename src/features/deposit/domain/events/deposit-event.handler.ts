import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DepositMatchedEvent } from './deposit-matched.event';
import { DepositPartiallyMatchedEvent } from './deposit-partially-matched.event';
import { DepositUnmatchedEvent } from './deposit-unmatched.event';
import { NotificationService } from 'src/features/notification/notification.service';
import { CreateNotificationDto } from 'src/features/notification/dto/create-notification.dto';
import { NotiType } from 'src/enums/noti-type.enum';
import { CreateDonationUseCase } from 'src/features/donation/commands/create-donation.usecase';
import { CreateDonationCommand } from 'src/features/donation/commands/create-donation.command';
import { IncreaseFundSumUseCase } from 'src/features/funding/commands/increase-fundsum.usecase';
import { IncreaseFundSumCommand } from 'src/features/funding/commands/increase-fundsum.command';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { Repository } from 'typeorm';
import { Deposit } from '../entities/deposit.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindAllAdminsUseCase } from 'src/features/admin/queries/find-all-admins.usecase';
import { User } from 'src/entities/user.entity';
import { DecreaseFundSumUseCase } from 'src/features/funding/commands/decrease-fundsum.usecase';
import { DepositRefundedEvent } from './deposit-refunded.event';
import { DepositStatus } from 'src/enums/deposit-status.enum';
import { DecreaseFundSumCommand } from 'src/features/funding/commands/decrease-fundsum.command';
import { DepositDeletedEvent } from './deposit-deleted.event';
import { ProvisionalDonation } from '../entities/provisional-donation.entity';
import { ProvisionalDonationStatus } from 'src/enums/provisional-donation-status.enum';

@Injectable()
export class DepositEventHandler {
  constructor(
    private readonly g2gException: GiftogetherExceptions,
    private readonly createDonation: CreateDonationUseCase,
    private readonly increaseFundSum: IncreaseFundSumUseCase,
    private readonly decreaseFundSum: DecreaseFundSumUseCase,
    private readonly notiService: NotificationService,
    @InjectRepository(Deposit)
    private readonly depositRepo: Repository<Deposit>,
    @InjectRepository(ProvisionalDonation)
    private readonly provDonRepo: Repository<ProvisionalDonation>,
    private readonly findAllAdmins: FindAllAdminsUseCase,
  ) {}

  /**
   * 1. 정식 후원 내역에 한 건 추가합니다.
   * 2. 펀딩의 달성 금액이 업데이트 됩니다 `Funding.fundSum`
   * 3. 후원자에게 알림을 보냅니다. `DonationSucessNotification`
   * 4. 펀딩주인에게 알림을 보냅니다. `NewDonate`
   */
  @OnEvent('deposit.matched')
  async handleDepositMatched(event: DepositMatchedEvent) {
    const { deposit, provisionalDonation } = event;
    const { funding, senderUser } = provisionalDonation;
    // 1
    await this.createDonation.execute(
      new CreateDonationCommand(funding, deposit.amount, senderUser, deposit),
    );

    // 2
    await this.increaseFundSum.execute(
      new IncreaseFundSumCommand(funding, deposit.amount),
    );

    // 3
    const createNotificationDtoForSender = new CreateNotificationDto({
      recvId: senderUser.userId,
      sendId: undefined,
      notiType: NotiType.DonationSuccess,
      subId: funding.fundUuid,
    });
    await this.notiService.createNoti(createNotificationDtoForSender);

    // 4
    const createNotificationDtoForReceiver = new CreateNotificationDto({
      recvId: funding.fundUser.userId,
      sendId: provisionalDonation.senderUser.userId,
      notiType: NotiType.NewDonate,
      subId: funding.fundUuid,
    });
    await this.notiService.createNoti(createNotificationDtoForReceiver);
  }

  /**
   * - 조건: 보내는 분은 일치하지만 이체 금액이 다른 경우 → 부분 매칭
   *
   * 1. 예비 후원의 상태가 '반려'인지 확인합니다.
   * 2. 시스템은 후원자에게 반려 사유를 포함한 알림을 발송합니다.
   * 3. 시스템은 관리자에게 부분매칭이 된 예비후원이 발생함 알림을 발송합니다.
   * 4. 관리자는 해당 건에 대해서 환불, 혹은 삭제 조치를 진행해야 합니다.
   */
  @OnEvent('deposit.partiallyMatched')
  async handleDepositPartiallyMatched(event: DepositPartiallyMatchedEvent) {
    const { deposit, provDon } = event;

    // 1
    if (provDon.status !== ProvisionalDonationStatus.Rejected) {
      throw this.g2gException.InvalidStatus;
    }

    // 2
    const notiDtoForSender = new CreateNotificationDto({
      recvId: provDon.senderUser.userId,
      sendId: null, // because system is sender
      notiType: NotiType.DonationPartiallyMatched,
      subId: deposit.depositId.toString(),
    });
    this.notiService.createNoti(notiDtoForSender);

    // 3
    this.findAllAdmins.execute().then((admins: User[]) => {
      admins.forEach((admin: User) => {
        const notiDto = new CreateNotificationDto({
          recvId: admin.userId,
          sendId: null, // because the system is sender
          notiType: NotiType.DonationPartiallyMatched,
          subId: deposit.depositId.toString(),
        });
        this.notiService.createNoti(notiDto);
      });
    });

    // 3은 관리자 중 한명이 업무를 처리하여 삭제하던, 환불조치를 취하던 ACT가 발생한
    // 이후에 처리해야 합니다. DepositEventHandler는 Unmatched된 입금내역에 대한
    // 사후처리를 책임져야 합니다.
  }

  /**
   * 1. 입금 내역이 ‘고아 상태’인지 확인합니다.
   * 2. 시스템은 관리자에게 해당 입금내역이 고아상태임을 알리는 알림을 발송합니다.
   * 3. 관리자는 해당 건에 대해 확인 및 조치를 취해야 합니다.
   *     - 보내는 분의 신원이 식별될 경우 환불을 진행합니다.
   *     - 보내는 분의 신원이 식별되지 않을경우? 어쩌지? 냠냠?
   */
  @OnEvent('deposit.unmatched')
  async handleDepositUnmatched(event: DepositUnmatchedEvent) {
    const { deposit } = event;

    // 1
    if (deposit.status !== DepositStatus.Orphan) {
      throw this.g2gException.InvalidStatus;
    }

    // 2
    const users: User[] = await this.findAllAdmins.execute();
    for (const u of users) {
      const notiDto = new CreateNotificationDto({
        recvId: u.userId,
        sendId: null, // because system is sender
        notiType: NotiType.DepositUnmatched,
        subId: deposit.depositId.toString(),
      });
      await this.notiService.createNoti(notiDto);
    }

    // 3은 관리자 중 한명이 업무를 처리하여 삭제하던, 환불조치를 취하던 ACT가 발생한
    // 이후에 처리해야 합니다. DepositEventHandler는 고아처리가 된 입금내역에 대한
    // 사후처리를 책임져야 합니다.
  }

  /**
   * 관리자가 해당 입금내역을 환불처리한 경우 입금내역의 생애주기가 올바르게 전환되는지를 따져보아야 합니다.
   */
  @OnEvent('deposit.refunded')
  async handleDepositRefunded(event: DepositRefundedEvent) {
    const { deposit } = event;

    deposit.refund(this.g2gException);

    if (deposit.status === DepositStatus.Matched) {
      /**
       * 이미 Donation이 만들어져있고, Funding.fundSum이 increase 되어있습니다.
       *
       * 1. donation을 refund 처리합니다. [[donation.entity]] 참조
       * 2. fundSum을 donAmnt 만큼 decrease 시키는 도메인 이벤트를 발생시킵니다.
       */
      this.decreaseFundSum.execute(
        new DecreaseFundSumCommand(deposit.donation.funding, deposit.amount),
      );
    }

    this.depositRepo.save(deposit);
    this.depositRepo.softDelete(deposit.depositId);
  }

  /**
   * 관리자가 해당 입금내역을 삭제처리한 경우 입금내역의 생애주기가 올바르게 전환되는지를 따져보아야 합니다.
   */
  @OnEvent('deposit.deleted')
  async handleDepositDeleted(event: DepositDeletedEvent) {
    const { deposit } = event;
    deposit.delete();

    this.depositRepo.save(deposit);
    this.depositRepo.softDelete(deposit.depositId);
  }
}
