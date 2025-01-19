import { BaseEvent } from '../../../../interfaces/event.interface';

export class DonationCreatedEvent extends BaseEvent {
  constructor(public readonly donId: number) {
    super();
  }
}
