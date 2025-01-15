import { Deposit } from '../../../../entities/deposit.entity';
import { BaseEvent } from '../../../../interfaces/event.interface';

export class DepositDeletedEvent extends BaseEvent {
  constructor(
    public readonly deposit: Deposit,
    public readonly senderSig: string,
  ) {
    super();
  }
}
