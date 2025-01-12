import { BaseEvent } from 'src/interfaces/event.interface';

export class ProvisionalDonationApprovedEvent extends BaseEvent {
  constructor(public readonly senderSig: string) {
    super();
  }
}
