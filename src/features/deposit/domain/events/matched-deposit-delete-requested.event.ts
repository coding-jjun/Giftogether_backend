import { BaseEvent } from '../../../../interfaces/event.interface';

export class MatchedDepositDeleteRequestedEvent extends BaseEvent {
  constructor(
    public readonly depositId: number,
    public readonly adminId: number, // !FIXME - Event Sourcing 패턴을 도입하여 불필요한 파라메터 제거
  ) {
    super();
  }
}
