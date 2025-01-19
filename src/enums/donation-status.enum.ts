export enum DonationStatus {
  Donated = 'Donated', // 후원한 상태
  WaitingRefund = 'WaitingRefund', // 환불 대기중
  WaitingRefundPhase2 = 'WaitingRefundPhase2', // 관리자 매칭 완료, 환불  대기중 (환불 취소 가능)
  RefundComplete = 'RefundComplete', // 환불 완료
  Deleted = 'Deleted', // 삭제 완료
}
