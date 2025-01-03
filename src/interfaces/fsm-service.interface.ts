import { EventName } from './transition.interface';

export interface IFsmService<State> {
  transition(current: State, event: EventName): State;
}
