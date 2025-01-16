import { BaseEvent } from 'src/interfaces/event.interface';

export class ProvisionalDonationMatchCancelledEvent extends BaseEvent {
  constructor(public readonly senderSig: string) {
    super();
  }
}
