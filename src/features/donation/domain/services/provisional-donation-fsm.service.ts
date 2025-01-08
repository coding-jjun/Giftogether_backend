import { Injectable } from '@nestjs/common';
import { ProvisionalDonationStatus as S } from 'src/enums/provisional-donation-status.enum';
import { IFsmService } from 'src/interfaces/fsm-service.interface';
import { EventName, Transition } from 'src/interfaces/transition.interface';
import { ProvisionalDonationApprovedEvent } from '../events/provisional-donation-approved.event';
import { ProvisionalDonationPartiallyMatchedEvent } from '../events/provisional-donation-partially-matched.event';
import { ProvisionalDonationTimedOutEvent } from '../events/provisional-donation-timed-out.event';
import { ProvisionalDonationMatchCancelledEvent } from '../events/provisional-donation-match-cancelled.event';

@Injectable()
export class ProvisionalDonationFsmService implements IFsmService<S> {
  private readonly transitions: Transition<S>[] = [
    {
      from: S.Pending,
      to: S.Approved,
      event: ProvisionalDonationApprovedEvent.name,
    },
    {
      from: S.Pending,
      to: S.Rejected,
      event: ProvisionalDonationPartiallyMatchedEvent.name,
    },
    {
      from: S.Pending,
      to: S.Rejected,
      event: ProvisionalDonationTimedOutEvent.name,
    },
    {
      from: S.Approved,
      to: S.Pending,
      event: ProvisionalDonationMatchCancelledEvent.name,
    },
    {
      from: S.Rejected,
      to: S.Pending,
      event: ProvisionalDonationMatchCancelledEvent.name,
    },
  ];

  transition(current: S, event: EventName): S {
    throw new Error('Method not implemented.');
  }
}
