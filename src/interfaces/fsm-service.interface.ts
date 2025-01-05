import { EventName } from './transition.interface';

/**
 * 상태 기계(FSM, Finite State Machine)를 구현하기 위한 인터페이스입니다.
 *
 * State 타입 파라미터를 받아 해당 상태에서 다른 상태로의 전이(transition)를
 * 정의하고 관리합니다.
 *
 * @example
  // 입금 상태 FSM 예시
  class DepositFsmService implements IFsmService<DepositStatus> {
    // Unmatched -> Matched (입금 매칭됨)
    // Unmatched -> Orphan (입금 매칭 실패)
    // Matched -> Refunded (환불됨)
    transition(current: DepositStatus, event: EventName): DepositStatus {
      // 현재 상태와 이벤트에 따른 다음 상태 반환
      // 유효하지 않은 전이인 경우 예외 발생
    }
  }
 * @throws Error 정의되지 않은 상태 전이를 시도할 경우 예외 발생
 */
export interface IFsmService<State> {
  transition(current: State, event: EventName): State;
}
