import { BaseEvent } from '../../../../interfaces/event.interface';

export class DonationRefundCancelledEvent extends BaseEvent {
  constructor(
    public readonly donId: number,
    public readonly donorId: number,
    public readonly assignedAdminId?: number,
  ) {
    super();
  }
}
