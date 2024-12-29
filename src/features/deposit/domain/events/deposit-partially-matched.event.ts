import { Deposit } from 'src/features/deposit/domain/entities/deposit.entity';
import { Donation } from 'src/entities/donation.entity';

export class DepositPartiallyMatchedEvent {
  constructor(
    public readonly deposit: Deposit,
    public readonly donation: Donation,
  ) {}
}
