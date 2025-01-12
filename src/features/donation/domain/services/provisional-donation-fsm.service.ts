import { Injectable } from '@nestjs/common';
import { ProvisionalDonationStatus as S } from 'src/enums/provisional-donation-status.enum';
import { IFsmService } from 'src/interfaces/fsm-service.interface';
import { EventName, Transition } from 'src/interfaces/transition.interface';
import { ProvisionalDonationApprovedEvent } from '../events/provisional-donation-approved.event';
import { ProvisionalDonationPartiallyMatchedEvent } from '../events/provisional-donation-partially-matched.event';
import { ProvisionalDonationTimedOutEvent } from '../events/provisional-donation-timed-out.event';
import { ProvisionalDonationMatchCancelledEvent } from '../events/provisional-donation-match-cancelled.event';
import { InvalidStatus } from 'src/exceptions/invalid-status';
import { DepositMatchedEvent } from 'src/features/deposit/domain/events/deposit-matched.event';
import { DepositPartiallyMatchedEvent } from 'src/features/deposit/domain/events/deposit-partially-matched.event';

@Injectable()
export class ProvisionalDonationFsmService implements IFsmService<S> {
  private readonly transitions: Transition<S>[] = [
    {
      from: S.Pending,
      to: S.Approved,
      event: DepositMatchedEvent.name,
    },
    {
      from: S.Pending,
      to: S.Rejected,
      event: DepositPartiallyMatchedEvent.name,
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
    const transition = this.transitions.find(
      (t) => t.from === current && t.event === event,
    );
    if (!transition) {
      throw new InvalidStatus(current.toString(), event);
    }
    return transition.to;
  }
}
