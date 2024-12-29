export enum DonationStatus {
  Pending = 'Pending', // 아직 후원하지 않은 상태
  Approved = 'Approved', // 후원한 상태
  Rejected = 'Rejected', // 후원금액이 맞지 않은 상태
  WaitingRefund = 'WaitingRefund', // 환불 대기중
  RefundComplete = 'RefundComplete', // 환불 완료
  WaitingDelete = 'WaitingDelete', // 삭제 대기중
  Deleted = 'Deleted', // 삭제 완료
  FundingClosed = 'FundingClosed', // 펀딩 마감
}
