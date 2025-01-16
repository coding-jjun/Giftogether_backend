import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Deposit } from '../../../../entities/deposit.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GiftogetherExceptions } from '../../../../filters/giftogether-exception';
import { MatchedDepositDeleteRequestedEvent } from './matched-deposit-delete-requested.event';
import { PartiallyMatchedDepositDeleteRequestedEvent } from './partially-matched-deposit-delete-requested.event';
import { DeleteDonationUseCase } from '../../../donation/commands/delete-donation.usecase';
import { DonationDeleteFailedEvent } from '../../../donation/domain/events/donation-delete-failed.event';
import { DonationDeletedEvent } from '../../../donation/domain/events/donation-deleted.event';
import { ProvisionalDonationResetEvent } from '../../../donation/domain/events/provisional-donation-reset.event';
import { ProvisionalDonationMatchCancelledEvent } from '../../../donation/domain/events/provisional-donation-match-cancelled.event';

@Injectable()
export class DepositDeleteSaga {
  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,
    private readonly g2gException: GiftogetherExceptions,
    private readonly deleteDonation: DeleteDonationUseCase,
    // private readonly unmatchProvDon: UnmatchProvDonUseCase, // TODO - implement
  ) {}

  /**
   * 후원이 정상적으로 처리되어 연관된 후원을 먼저 제거해야 합니다. 이 프로세스는 후원 삭제 성공 여부에 따라 실패할 수 있는 프로세스로, 예외 발생시 적절한 보상조치를 수행합니다.
   */
  @OnEvent(MatchedDepositDeleteRequestedEvent.name, { async: true })
  async handleMatchedDepositDeleteRequested(
    event: MatchedDepositDeleteRequestedEvent,
  ) {
    const { depositId } = event;

    const deposit = await this.depositRepository.findOne({
      where: { depositId },
    });

    if (!deposit) {
      throw this.g2gException.DepositNotFound;
    }
  }

  @OnEvent(PartiallyMatchedDepositDeleteRequestedEvent.name, { async: true })
  async handlePartiallyMatchedDepositDeleteRequested(
    event: PartiallyMatchedDepositDeleteRequestedEvent,
  ) {
    const { depositId } = event;

    const deposit = await this.depositRepository.findOne({
      where: { depositId },
    });

    if (!deposit) {
      throw this.g2gException.DepositNotFound;
    }
  }

  /**
   * 후원 삭제 실패시 보상조치를 처리하는 로직이 담겨있습니다.
   */
  @OnEvent(DonationDeleteFailedEvent.name, { async: true })
  async handleDonationDeleteFailed(event: DonationDeleteFailedEvent) {
    const { donId, donorId, adminId } = event;

    // TODO - 후원 삭제 실패 시 처리
  }

  /**
   * 후원 삭제 성공 시 처리
   */
  @OnEvent(DonationDeletedEvent.name, { async: true })
  async handleDonationDeleted(event: DonationDeletedEvent) {
    const { donId, donorId, fundId, adminId } = event;
    // TODO - 후원 삭제 성공 시 처리
  }

  /**
   * 예비 후원 매치 취소 성공시 처리
   */
  @OnEvent(ProvisionalDonationMatchCancelledEvent.name, { async: true })
  async handleProvDonMatchCancelled(
    event: ProvisionalDonationMatchCancelledEvent,
  ) {
    const { senderSig } = event;
    // TODO - 예비후원 매치취소 성공 시 처리
  }
}
