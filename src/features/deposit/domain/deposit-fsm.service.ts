import { Injectable } from '@nestjs/common';
import { DepositStatus as State } from 'src/enums/deposit-status.enum';
import { EventName, Transition } from 'src/interfaces/transition.interface';
import { DepositMatchedEvent } from './events/deposit-matched.event';
import { DepositUnmatchedEvent } from './events/deposit-unmatched.event';
import { DepositRefundedEvent } from './events/deposit-refunded.event';
import { IFsmService } from 'src/interfaces/fsm-service.interface';
import { DepositDeletedEvent } from './events/deposit-deleted.event';
import { DepositDeleteFailedEvent } from './events/deposit-delete-failed.event';
import { InvalidStatus } from '../../../exceptions/invalid-status';
import { DepositPartiallyMatchedEvent } from './events/deposit-partially-matched.event';

@Injectable()
export class DepositFsmService implements IFsmService<State> {
  private readonly transitions: Transition<State>[] = [
    {
      from: State.Unmatched,
      to: State.Matched,
      event: DepositMatchedEvent.name,
    },
    {
      from: State.Unmatched,
      to: State.Orphan,
      event: DepositUnmatchedEvent.name,
    },
    {
      from: State.Unmatched,
      to: State.PartiallyMatched,
      event: DepositPartiallyMatchedEvent.name,
    },
    {
      from: State.Matched,
      to: State.Refunded,
      event: DepositRefundedEvent.name,
    },
    {
      from: State.Matched,
      to: State.Matched,
      event: DepositDeleteFailedEvent.name,
    },
    {
      from: State.Unmatched,
      to: State.Deleted,
      event: DepositDeletedEvent.name,
    },
    {
      from: State.Orphan,
      to: State.Deleted,
      event: DepositDeletedEvent.name,
    },
    {
      from: State.Matched,
      to: State.Deleted,
      event: DepositDeletedEvent.name,
    },
    {
      from: State.PartiallyMatched,
      to: State.Deleted,
      event: DepositDeletedEvent.name,
    },
  ];

  transition(current: State, event: EventName): State {
    const transition = this.transitions.find(
      (t) => t.from === current && t.event === event,
    );

    if (!transition) {
      throw new InvalidStatus(
        `Invalid transition: No transition for event "${event}" from state "${current}"`,
      );
    }

    return transition.to;
  }
}
