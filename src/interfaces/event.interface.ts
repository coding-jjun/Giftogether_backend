import { EventName } from './transition.interface';

export abstract class BaseEvent implements IEvent {
  name: EventName = this.constructor.name;
}
export interface IEvent {
  name: EventName;
}
