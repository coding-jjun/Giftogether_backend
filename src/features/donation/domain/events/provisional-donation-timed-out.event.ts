import { BaseEvent } from 'src/interfaces/event.interface';

export class ProvisionalDonationTimedOutEvent extends BaseEvent {
  constructor(public readonly senderSig: string) {
    super();
  }
} 