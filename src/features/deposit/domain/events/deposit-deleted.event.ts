import { BaseEvent } from '../../../../interfaces/event.interface';

export class DepositDeletedEvent extends BaseEvent {
  constructor(
    public readonly depositId: number,
    public readonly senderSig: string,
  ) {
    super();
  }
}
