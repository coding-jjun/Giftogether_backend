export type EventName = string;

export interface Transition<State> {
  from: State;
  to: State;
  event: EventName;
}
