import { Injectable } from '@nestjs/common';
import { DepositStatus as State } from 'src/enums/deposit-status.enum';
import { EventName, Transition } from 'src/interfaces/transition.interface';
import { DepositMatchedEvent } from './events/deposit-matched.event';
import { DepositUnmatchedEvent } from './events/deposit-unmatched.event';
import { DepositRefundedEvent } from './events/deposit-refunded.event';

@Injectable()
export class DepositFsmService {
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
      from: State.Matched,
      to: State.Refunded,
      event: DepositRefundedEvent.name,
    },
  ];

  transition(current: State, event: EventName): State {
    const transition = this.transitions.find(
      (t) => t.from === current && t.event === event,
    );

    if (!transition) {
      throw new Error(
        // !FIXME: 구체적인 에러타입 throw 하기
        `Invalid transition: No transition for event "${event}" from state "${current}"`,
      );
    }

    return transition.to;
  }
}
