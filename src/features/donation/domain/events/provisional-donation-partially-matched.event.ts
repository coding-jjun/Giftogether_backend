import { BaseEvent } from 'src/interfaces/event.interface';

export class ProvisionalDonationPartiallyMatchedEvent extends BaseEvent {
  constructor(public readonly senderSig: string) {
    super();
  }
} 