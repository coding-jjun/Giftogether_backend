import { BaseEvent } from '../../../../interfaces/event.interface';

export class AdminAssignedForDonationRefundEvent extends BaseEvent {
  constructor(
    public readonly donId: number,
    public readonly assignedAdminId: number,
  ) {
    super();
  }
}
