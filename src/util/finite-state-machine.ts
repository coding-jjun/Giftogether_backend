import { IEvent } from 'src/interfaces/event.interface';
import { Command, Transition } from 'src/interfaces/transition.interface';

export class FiniteStateMachine<S> {
  constructor(
    private _state: S,
    private readonly transitions: Transition<S>[],
    private readonly finalStates: Set<S>,
  ) {}

  get state(): S {
    return this._state;
  }

  dispatch(command: Command): IEvent {
    const transition = this.transitions.find(
      (t) => t.from === this.state && t.command === command,
    );

    if (!transition) {
      throw new Error(
        // !FIXME: 구체적인 에러타입 throw 하기
        `Invalid transition: No transition for command "${command}" from state "${this.state}"`,
      );
    }

    this._state = transition.to;
    return transition.event;
  }

  isFinalState(): boolean {
    return this.finalStates.has(this._state);
  }
}
