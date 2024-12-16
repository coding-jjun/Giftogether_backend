import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DepositMatchedEvent } from '../domain/events/deposit-matched.event';
import { DepositUnmatchedEvent } from '../domain/events/deposit-unmatched.event';
import { Deposit } from '../domain/entities/deposit.entity';
import { GiftogetherExceptions } from '../../../filters/giftogether-exception';
import { ProvisionalDonation } from '../domain/entities/provisional-donation.entity';
import { DepositPartiallyMatchedEvent } from '../domain/events/deposit-partially-matched.event';
import { FindProvDonationsBySenderSigUseCase } from '../queries/find-provisional-donations-by-sender-sig.usecase';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MatchDepositUseCase {
  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepo: Repository<Deposit>,

    @InjectRepository(ProvisionalDonation)
    private readonly provDonRepo: Repository<ProvisionalDonation>,

    private readonly eventEmitter: EventEmitter2,

    private readonly g2gException: GiftogetherExceptions,

    private readonly findDonationsBySenderSig: FindProvDonationsBySenderSigUseCase,
  ) {}

  async execute(deposit: Deposit): Promise<void> {
    const donations: ProvisionalDonation[] =
      await this.findDonationsBySenderSig.execute(deposit.senderSig);

    if (donations.length === 0) {
      /**
       * ## 불일치
       *
       * 보내는 분이 어떤 예비후원과도 매치하지 않는 경우
       * 조치:
       *  - 입금 내역을 '고아 상태'로 표시합니다.
       *  - 관리자는 해당 건에 대해 확인 및 조치를 취해야 합니다.
       */
      deposit.orphan(this.g2gException);
      this.depositRepo.save(deposit);

      this.eventEmitter.emit(
        'deposit.unmatched',
        new DepositUnmatchedEvent(deposit),
      );
      throw this.g2gException.DepositUnmatched;
    }

    const provDonation: ProvisionalDonation = donations.find(
      (v) => v.amount === deposit.amount,
    );

    if (provDonation) {
      /**
       * ## 일치
       *
       * 보내는 분 (실명 + 고유번호)과 이체 금액이 예비 후원과 일치하는 경우
       * 조치:
       *  - 예비 후원의 상태를 ‘승인’으로 변경합니다.
       *  - 해당 후원은 정식 후원 내역에 추가됩니다.
       *  - 펀딩의 달성 금액이 업데이트 됩니다.
       *  - 후원자에게 후원이 정상적으로 처리되었음을 알리는 알림을 발송합니다.
       */
      provDonation.approve(this.g2gException);
      this.provDonRepo.save(provDonation);

      this.eventEmitter.emit(
        'deposit.matched',
        new DepositMatchedEvent(deposit, provDonation),
      );
    } else {
      /**
       * ## 부분 매칭
       *
       * 보내는 분은 일치하지만 이체 금액이 다른 경우
       * 조치:
       *  - 예비 후원의 상태를 ‘반려’로 변경합니다.
       *  - 시스템은 후원자에게 반려 사유를 포함한 알림을 발송합니다.
       *  - 시스템은 관리자에게 부분매칭이 된 예비후원이 발생함 알림을 발송합니다.
       *  - 관리자는 해당 건에 대해서 환불 조치를 진행해야 합니다.
       */
      this.eventEmitter.emit(
        'deposit.partiallyMatched',
        new DepositPartiallyMatchedEvent(deposit),
      );
      throw this.g2gException.DepositPartiallyMatched;
    }
  }
}
