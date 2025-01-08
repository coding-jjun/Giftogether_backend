import { IFsmService } from 'src/interfaces/fsm-service.interface';
import { EventName } from 'src/interfaces/transition.interface';

/**
 * 이 인터페이스는 엔티티가 자신의 상태를 스스로 변경하면서 동시에 기술적인 복잡도를 감소시키기 위해 만들어졌습니다.
 * 상태변경이 외부로 노출되면 안되는 핵심 하위 도메인 영역의 엔티티들은 state 프로퍼티를 프라이빗으로 정의하게 되며,
 * 변경로직은 `IFsmService`가 제공하는 상태전이표를 참고하게 됩니다.
 *
 * @example
  class Deposit {
    transition(
      event: EventName,
      fsmService: IFsmService<DepositStatus>,
    ): void {
      const newState = fsmService.transition(this.status, event);
      this._status = newState;
    }
  }
 */
export interface ITransitionDelegate<State> {
  transition(event: EventName, fsmService: IFsmService<State>): void;
}
