import { BaseEvent } from '../../../../interfaces/event.interface';

export class DonationRefundCompletedEvent extends BaseEvent {
  constructor(public readonly donId: number) {
    super();
  }
}
