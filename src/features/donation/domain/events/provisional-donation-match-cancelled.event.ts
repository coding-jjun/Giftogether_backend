import { BaseEvent } from 'src/interfaces/event.interface';

export class ProvisionalDonationMatchCancelledEvent extends BaseEvent {
  constructor(
    public readonly depositId: number, // !FIXME - Event Sourcing 패턴을 도입하여 불필요한 파라메터 제거
    public readonly senderSig: string,
    public readonly adminId: number,
  ) {
    super();
  }
}
