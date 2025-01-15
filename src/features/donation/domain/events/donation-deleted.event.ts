import { BaseEvent } from '../../../../interfaces/event.interface';

export class DonationDeletedEvent extends BaseEvent {
  constructor(
    public readonly donId: number,
    public readonly donorId: number,
  ) {
    super();
  }
}
