import { Deposit } from 'src/entities/deposit.entity';
import { ProvisionalDonation } from '../../../../entities/provisional-donation.entity';
import { BaseEvent } from 'src/interfaces/event.interface';

export class DepositMatchedEvent extends BaseEvent {
  constructor(
    public readonly deposit: Deposit,
    public readonly provisionalDonation: ProvisionalDonation,
  ) {
    super();
  }
}
