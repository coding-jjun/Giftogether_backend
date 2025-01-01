import { Deposit } from 'src/features/deposit/domain/entities/deposit.entity';

export class DepositUnmatchedEvent {
  constructor(public readonly deposit: Deposit) {}
}
