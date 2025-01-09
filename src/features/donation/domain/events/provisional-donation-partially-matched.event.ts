import { BaseEvent } from 'src/interfaces/event.interface';

/**
 * @deprecated DepositPartiallyMatchedEvent로 통합되었습니다.
 */
export class ProvisionalDonationPartiallyMatchedEvent extends BaseEvent {
  constructor(public readonly senderSig: string) {
    super();
  }
} 