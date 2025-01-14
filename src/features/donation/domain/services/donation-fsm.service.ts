import { Injectable } from '@nestjs/common';
import { DonationStatus as S } from 'src/enums/donation-status.enum';
import { IFsmService } from 'src/interfaces/fsm-service.interface';
import { EventName, Transition } from 'src/interfaces/transition.interface';
import { InvalidStatus } from 'src/exceptions/invalid-status';
import { DonationRefundRequestedEvent } from '../events/donation-refund-requested.event';
import { DonationRefundCancelledEvent } from '../events/donation-refund-cancelled.event';
import { AdminAssignedForRefundEvent } from '../events/admin-assigned-for-refune.event';
import { DonationRefundCompletedEvent } from '../events/donation-refund-completed.event';
import { DonationDeletedEvent } from '../events/donation-deleted.event';
import { DonationDeleteFailedEvent } from '../events/donation-delete-failed.event';

@Injectable()
export class DonationFsmService implements IFsmService<S> {
  private readonly transitions: Transition<S>[] = [
    {
      from: S.Donated,
      to: S.WaitingRefund,
      event: DonationRefundRequestedEvent.name,
    },
    {
      from: S.WaitingRefund,
      to: S.Donated,
      event: DonationRefundCancelledEvent.name,
    },
    {
      from: S.WaitingRefund,
      to: S.WaitingRefundPhase2,
      event: AdminAssignedForRefundEvent.name,
    },
    {
      from: S.WaitingRefundPhase2,
      to: S.WaitingRefund,
      event: DonationRefundCancelledEvent.name,
    },
    {
      from: S.WaitingRefundPhase2,
      to: S.RefundComplete,
      event: DonationRefundCompletedEvent.name,
    },
    {
      from: S.Donated,
      to: S.Deleted,
      event: DonationDeletedEvent.name,
    },
    {
      from: S.Donated,
      to: S.Donated,
      event: DonationDeleteFailedEvent.name,
    },
  ];

  transition(current: S, event: EventName): S {
    const transition = this.transitions.find(
      (t) => t.from === current && t.event === event,
    );
    if (!transition) {
      throw new InvalidStatus(current.toString(), event);
    }
    return transition.to;
  }
}
