import { BaseEvent } from '../../../../interfaces/event.interface';

export class DonationDeletedEvent extends BaseEvent {
  constructor(
    public readonly donId: number,
    public readonly donorId: number,
    public readonly fundId: number,
    public readonly depositId: number, // !FIXME - Event Sourcing 패턴 구현하여 불필요한 파라메터 제거 필요
    public readonly adminId: number, // !FIXME - Event Sourcing 패턴 구현하여 불필요한 파라메터 제거 필요
  ) {
    super();
  }
}
