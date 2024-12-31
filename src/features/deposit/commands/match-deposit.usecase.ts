import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DepositMatchedEvent } from '../domain/events/deposit-matched.event';
import { DepositUnmatchedEvent } from '../domain/events/deposit-unmatched.event';
import { Deposit } from '../domain/entities/deposit.entity';
import { GiftogetherExceptions } from '../../../filters/giftogether-exception';
import { DepositPartiallyMatchedEvent } from '../domain/events/deposit-partially-matched.event';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetDonationBySenderSigUseCase } from 'src/features/donation/queries/get-donation-by-sender-sig.usecase';
import { RelateDonationWithDepositUseCase } from 'src/features/donation/commands/relate-donation-with-deposit.usecase';

@Injectable()
export class MatchDepositUseCase {
  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepo: Repository<Deposit>,

    private readonly eventEmitter: EventEmitter2,

    private readonly g2gException: GiftogetherExceptions,

    private readonly getDonationBySenderSig: GetDonationBySenderSigUseCase,

    private readonly relateDonationWithDeposit: RelateDonationWithDepositUseCase,
  ) {}

  async execute(deposit: Deposit): Promise<void> {
    const donation = await this.getDonationBySenderSig.execute(
      deposit.senderSig,
      { funding: { fundUser: true }, user: true },
    );

    if (!donation) {
      /**
       * ## 불일치
       *
       * 보내는 분이 어떤 예비후원과도 매치하지 않는 경우
       * 조치:
       *  - 입금 내역을 '고아 상태'로 표시합니다.
       *  - 관리자는 해당 건에 대해 확인 및 조치를 취해야 합니다.
       */
      deposit.orphan(this.g2gException);
      await this.depositRepo.save(deposit);

      this.eventEmitter.emit(
        'deposit.unmatched',
        new DepositUnmatchedEvent(deposit),
      );
      throw this.g2gException.DepositUnmatched;
    }

    if (donation.amount === deposit.amount) {
      /**
       * ## 일치
       *
       * 보내는 분 (실명 + 고유번호)과 이체 금액이 예비 후원과 일치하는 경우
       * 조치:
       *  - 후원과 이체내역을 서로 연결합니다.
       *  - 후원과 이체내역의 상태를 ‘승인’으로 변경합니다.
       *  - 펀딩의 달성 금액이 업데이트 됩니다.
       *  - 후원자에게 후원이 정상적으로 처리되었음을 알리는 알림을 발송합니다.
       */

      deposit.matched(this.g2gException);
      await this.depositRepo.save(deposit);

      this.eventEmitter.emit(
        'deposit.matched',
        new DepositMatchedEvent(deposit, donation),
      );
    } else {
      /**
       * ## 부분 매칭
       *
       * 보내는 분은 일치하지만 이체 금액이 다른 경우
       * 조치:
       *  - 후원의 상태를 ‘반려’로 변경합니다.
       *  - 시스템은 후원자에게 반려 사유를 포함한 알림을 발송합니다.
       *  - 시스템은 관리자에게 부분매칭이 된 예비후원이 발생함 알림을 발송합니다.
       *  - 관리자는 해당 건에 대해서 환불 조치를 진행해야 합니다.
       */
      donation.reject(this.g2gException);
      await this.donationRepo.save(donation);

      this.eventEmitter.emit(
        'deposit.partiallyMatched',
        new DepositPartiallyMatchedEvent(deposit, donation),
      );
      throw this.g2gException.DepositPartiallyMatched;
    }
  }
}
