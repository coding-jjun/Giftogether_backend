import { Injectable } from '@nestjs/common';
import { DepositService } from '../deposit.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deposit } from '../../../entities/deposit.entity';
import { DepositFsmService } from '../domain/deposit-fsm.service';
import { GiftogetherExceptions } from '../../../filters/giftogether-exception';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IEvent } from '../../../interfaces/event.interface';
import { DepositStatus } from '../../../enums/deposit-status.enum';
import { MatchedDepositDeleteRequestedEvent } from '../domain/events/matched-deposit-delete-requested.event';
import { PartiallyMatchedDepositDeleteRequestedEvent } from '../domain/events/partially-matched-deposit-delete-requested.event';
import { DeleteDepositUseCase } from './delete-deposit.usecase';
import { DepositDeletedEvent } from '../domain/events/deposit-deleted.event';

/**
 * 입금내역 삭제요청 유스케이스
 *
 * 관리자가 입금내역을 삭제하는 요청을 보내면, 시스템은 입금내역을 삭제하는 이벤트를 발송합니다.
 */
@Injectable()
export class RequestDeleteDepositUseCase {
  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,
    private readonly depositFsmService: DepositFsmService,
    private readonly g2gException: GiftogetherExceptions,
    private readonly eventEmitter: EventEmitter2,
    private readonly depositService: DepositService,
    private readonly deleteDeposit: DeleteDepositUseCase,
  ) {}

  async execute(depositId: number, adminId: number): Promise<void> {
    const deposit = await this.depositRepository.findOne({
      where: { depositId },
    });

    if (!deposit) {
      throw this.g2gException.DepositNotFound;
    }

    // 이벤트 발송
    let event: IEvent;
    if (deposit.status === DepositStatus.Matched) {
      event = new MatchedDepositDeleteRequestedEvent(
        deposit.depositId,
        adminId,
      );
    } else if (deposit.status === DepositStatus.PartiallyMatched) {
      event = new PartiallyMatchedDepositDeleteRequestedEvent(
        deposit.depositId,
        deposit.senderSig,
        adminId,
      );
    } else if (
      deposit.status === DepositStatus.Unmatched ||
      deposit.status === DepositStatus.Orphan
    ) {
      // 즉각적인 삭제 가능
      await this.deleteDeposit.execute(depositId);
      event = new DepositDeletedEvent(
        deposit.depositId,
        deposit.senderSig,
        adminId,
      );
    }

    this.eventEmitter.emit(event.name, event);
  }
}
