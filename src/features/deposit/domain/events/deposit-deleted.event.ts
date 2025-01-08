import { Deposit } from '../../../../entities/deposit.entity';

export class DepositDeletedEvent {
  constructor(public readonly deposit: Deposit) {}
}
