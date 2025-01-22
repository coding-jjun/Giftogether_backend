import { BaseEvent } from '../../../../interfaces/event.interface';

export class DonationDeletedEvent extends BaseEvent {
  constructor(
    public readonly donId: number,
    public readonly donorId: number,
    public readonly fundId: number,
    public readonly adminId: number,
  ) {
    super();
  }
}
