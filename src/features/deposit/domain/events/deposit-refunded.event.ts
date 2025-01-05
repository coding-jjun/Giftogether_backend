import { BaseEvent } from 'src/interfaces/event.interface';
import { Deposit } from '../entities/deposit.entity';

export class DepositRefundedEvent extends BaseEvent {
  constructor(public readonly deposit: Deposit) {
    super();
  }
}
