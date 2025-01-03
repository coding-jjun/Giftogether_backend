import { Deposit } from 'src/features/deposit/domain/entities/deposit.entity';
import { BaseEvent } from 'src/interfaces/event.interface';

export class DepositUnmatchedEvent extends BaseEvent {
  constructor(public readonly deposit: Deposit) {
    super();
  }
}
