import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Deposit } from '../../../entities/deposit.entity';
import { Repository } from 'typeorm';
import { DepositFsmService } from '../domain/deposit-fsm.service';
import { DepositDeletedEvent } from '../domain/events/deposit-deleted.event';
import { GiftogetherExceptions } from '../../../filters/giftogether-exception';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DepositDto } from '../dto/deposit.dto';

/**
 * 입금내역 삭제
 *
 * Deposit의 상태를 삭제 상태로 변경하고, 삭제 이벤트를 발송한다.
 */
@Injectable()
export class DeleteDepositUseCase {
  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,
    private readonly depositFsmService: DepositFsmService,
    private readonly g2gException: GiftogetherExceptions,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(depositId: number): Promise<DepositDto> {
    const deposit = await this.depositRepository.findOne({
      where: { depositId },
    });

    if (!deposit) {
      throw this.g2gException.DepositNotFound;
    }

    const event = new DepositDeletedEvent(deposit.depositId, deposit.senderSig);

    deposit.transition(event.name, this.depositFsmService);

    /**
     * !NOTE - delAt과 state.Deleted가 중복된 정보를 저장하는 것 아니냐?
     *
     * - delAt: 물리적 관점에서 데이터를 논리적으로 삭제 처리한다. 데이터의 삭제 시간과 함께, ORM에서 제공하는 자동화된 기능을 활용할 수 있게 해줍니다.
     * - state.Deleted: 논리적/비즈니스 관점에서 특정 객체의 상태를 표현한다. FSM과 결합해 객체가 가질 수 있는 상태를 제한하고 비즈니스 로직의 일관성을 유지한다.
     */
    await this.depositRepository.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.save(deposit);
        await transactionalEntityManager.softDelete(Deposit, depositId);
      },
    );

    this.eventEmitter.emit(event.name, event);

    return new DepositDto(deposit);
  }
}
