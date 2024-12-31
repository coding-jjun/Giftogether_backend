export enum DepositStatus {
  Unmatched = 'Unmatched', // 아직 매칭 알고리즘이 돌지 않은 상태.
  PartiallyMatched = 'PartiallyMatched', // Donation과 매칭은 되었으나, 금액이 일치하지 않는 상태.
  Matched = 'Matched',
  Orphan = 'Orphan',
  Refunded = 'Refunded',
  Deleted = 'Deleted',
}
