export enum DepositStatus {
  Unmatched = 'Unmatched', // 아직 매칭 알고리즘이 돌지 않은 상태.
  PartiallyMatched = 'PartiallyMatched', // 부분 매칭 상태
  Matched = 'Matched',
  Orphan = 'Orphan',
  Refunded = 'Refunded',
  Deleted = 'Deleted',
}
