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

@Injectable()
export class MatchDepositUseCase {
  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepo: Repository<Deposit>,

    private readonly eventEmitter: EventEmitter2,

    private readonly g2gException: GiftogetherExceptions,

    private readonly getDonationBySenderSig: GetDonationBySenderSigUseCase,
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
       * 조치
       *  - Deposit의 상태를 Matched로 변경
       *  - Donation, Funding, Notification 작업은 deposit-event-handler에서 확인바랍니다.
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
       *  - Deposit의 상태를 PartiallyMatched로 변경합니다.
       *  - Donation, Notification 작업은 deposit-event-handler에서 확인바랍니다.
       */

      deposit.partiallyMatched(this.g2gException);
      await this.depositRepo.save(deposit);

      this.eventEmitter.emit(
        'deposit.partiallyMatched',
        new DepositPartiallyMatchedEvent(deposit, donation),
      );
      throw this.g2gException.DepositPartiallyMatched;
    }
  }
}
