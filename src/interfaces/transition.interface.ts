export type Command = string;
type Event = any;

export interface Transition<State> {
  from: State;
  to: State;
  command: Command;
  event: Event;
}
