import { IFsmService } from 'src/interfaces/fsm-service.interface';
import { EventName } from 'src/interfaces/transition.interface';

export interface ITransitionDelegate<State> {
  transition(event: EventName, fsmService: IFsmService<State>): void;
}
