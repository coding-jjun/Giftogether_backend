import { Deposit } from '../entities/deposit.entity';

export class DepositRefundedEvent {
  constructor(public readonly deposit: Deposit) {}
}
