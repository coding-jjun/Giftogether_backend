import { BaseEvent } from '../../../../interfaces/event.interface';

export class AdminAssignedForRefundEvent extends BaseEvent {
  constructor(public readonly donId: number) {
    super();
  }
}
