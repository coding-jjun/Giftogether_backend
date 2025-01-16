import { Injectable } from '@nestjs/common';
import { DepositService } from '../deposit.service';
import { DepositDto } from '../dto/deposit.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deposit } from '../../../entities/deposit.entity';
import { DepositFsmService } from '../domain/deposit-fsm.service';
import { GiftogetherExceptions } from '../../../filters/giftogether-exception';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
  ) {}

  async execute(depositId: number): Promise<void> {
    const deposit = await this.depositRepository.findOne({
      where: { depositId },
    });

    if (!deposit) {
      throw this.g2gException.DepositNotFound;
    }

    // fsm service에 상태변화가 가능한 상태인지 질의
    this.depositFsmService.transition(deposit.status, DepositDeletedEvent.name); // throws!!

    // 이벤트 발송
    const event = new DepositDeletedEvent(deposit.depositId, deposit.senderSig);
    this.eventEmitter.emit(event.name, event);
  }
}
