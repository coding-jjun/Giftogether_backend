import { BaseEvent } from 'src/interfaces/event.interface';

/**
 * @deprecated DepositCancelledEvent로 통합되었습니다.
 */
export class ProvisionalDonationMatchCancelledEvent extends BaseEvent {
  constructor(public readonly senderSig: string) {
    super();
  }
} 