import { BaseEvent } from '../../../../interfaces/event.interface';

export class DonationDeleteFailedEvent extends BaseEvent {
  constructor(
    public readonly donId: number,
    public readonly donorId: number,
    public readonly adminId: number,
  ) {
    super();
  }
}
