import { IEvent } from './event.interface';

export type Command = string;

export interface Transition<State> {
  from: State;
  to: State;
  command: Command;
  event: IEvent;
}
