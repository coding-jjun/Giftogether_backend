import { Injectable } from '@nestjs/common';
import { DepositStatus as State } from 'src/enums/deposit-status.enum';
import { Command, Transition } from 'src/interfaces/transition.interface';
import { DepositMatchedEvent } from './events/deposit-matched.event';
import { DepositUnmatchedEvent } from './events/deposit-unmatched.event';
import { DepositRefundedEvent } from './events/deposit-refunded.event';

@Injectable()
export class DepositFsmService {
  private readonly transitions: Transition<State>[] = [
    {
      from: State.Unmatched,
      to: State.Matched,
      command: 'Match',
      event: DepositMatchedEvent,
    },
    {
      from: State.Unmatched,
      to: State.Orphan,
      command: 'Orphan',
      event: DepositUnmatchedEvent,
    },
    {
      from: State.Matched,
      to: State.Refunded,
      command: 'Refund',
      event: DepositRefundedEvent,
    },
  ];

  transition(current: State, command: Command): State {
    const transition = this.transitions.find(
      (t) => t.from === current && t.command === command,
    );

    if (!transition) {
      throw new Error(
        // !FIXME: 구체적인 에러타입 throw 하기
        `Invalid transition: No transition for command "${command}" from state "${current}"`,
      );
    }

    return transition.to;
  }
}
