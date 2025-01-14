import { BaseEvent } from '../../../../interfaces/event.interface';

export class DonationRefundCancelledEvent extends BaseEvent {
  constructor(public readonly donId: number) {
    super();
  }
}
