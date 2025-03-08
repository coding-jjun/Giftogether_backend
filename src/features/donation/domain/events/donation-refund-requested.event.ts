import { BaseEvent } from '../../../../interfaces/event.interface';

export class DonationRefundRequestedEvent extends BaseEvent {
  constructor(
    public readonly donId: number,
    public readonly donorId: number,
  ) {
    super();
  }
}
