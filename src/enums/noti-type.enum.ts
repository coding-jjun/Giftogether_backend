export enum NotiType {
  IncomingFollow = 'IncomingFollow', // 들어오는 친구 요청
  NewFriend = 'NewFriend', // 새로운 친구
  FundClose = 'FundClose', // 내 펀딩 마감
  FundAchieve = 'FundAchieve', // 내 펀딩 달성
  NewDonate = 'NewDonate', // 내 펀딩에 들어온 새로운 후원
  DonatedFundClose = 'DonatedFundClose', // 내가 후원한 펀딩 마감
  WriteGratitude = 'WriteGratitude', // 감사인사 작성 권유
  CheckGratitude = 'CheckGratitude', // 내가 후원한 펀딩 감사인사 확인
  NewComment = 'NewComment', // 새로운 댓글
  DonationSuccess = 'DonationSuccess', // 후원이 성공적으로 이루어졌음
  DonationPartiallyMatched = 'DonationPartiallyMatched', // 후원이 금액이 안맞음
  DonationRefundRequested = 'DonationRefundRequested', // 후원 환불 요청
  DepositUnmatched = 'DepositUnmatched', // 이체내역이 어디에도 매치하지 않는 경우
  DonationRefundCancelled = 'DonationRefundCancelled', // 후원 환불 요청 취소
  DonationRefundCompleted = 'DonationRefundCompleted', // 후원 환불 완료
  DonationDeleted = 'DonationDeleted', // 후원 삭제
}

export enum ReqType {
  // NotiType이 IncomingFollow인 경우
  NotResponse = '00', // 요청에 응답하지 않은 상태
  Accept = '01', // 요청을 수락한 상태
  Refuse = '02', // 요청을 거절한 상태

  // NotiType이 WriteGratitude인 경우
  UnWritten = '03', // 감사인사를 작성하지 않은 상태
  Written = '04', // 감사인사를 작성한 상태
}
