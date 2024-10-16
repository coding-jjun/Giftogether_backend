export enum ErrorMsg {
  // Funding
  FundingNotExists = '펀딩이 존재하지 않습니다.',

  // Donation
  FundingClosed = '이미 마감된 펀딩입니다.',
  FundingNotClosed = '아직 마감되지 않은 펀딩입니다.',

  // Gift
  IncorrectGiftUrl = '선물 URL이 유효하지 않습니다.',
  GiftNotFound = '선물 정보가 없습니다.',

  // Gratitude
  GratitudeAlreadyExists = '감사인사가 이미 존재합니다.',
  GratitudeNotExist = '감사인사가 존재하지 않습니다.',

  // RollingPaper

  // Comment
  CommentNotFound = "해당 댓글이 존재하지 않습니다.",

  // Image
  IncorrectImageUrl = '이미지 URL이 유효하지 않습니다.',
  IncorrectImageHost = '이미지 호스트가 일치하지 않습니다.',
  ImageUriNotSpecified = '이미지 URI가 유효하지 않습니다.',
  ImageNotFound = '이미지가 존재하지 않습니다.',
  ImageIntegrityError = '이미지 속성이 유효하지 않습니다.',
  ImageAlreadyExists = '이미지가 이미 등록되어 있습니다.',

  // User
  UserNotFound = '사용자 정보가 없습니다.',
  UserNotUpdated = '사용자 업데이트에 실패했습니다',
  UserAlreadyDeleted = '사용자가 이미 삭제됐습니다',
  NotValidEmail = "이미 사용 중인 이메일 입니다.",
  NotValidPhone = "이미 사용 중인 번호 입니다.",
  NotValidNick = "이미 사용 중인 닉네임 입니다.",
  PasswordIncorrect = "비밀번호가 틀렸습니다. 다시 시도해주세요.",
  UserFailedToCreate = '사용자 생성에 실패했습니다',
  UserAccessDenied = "접근 권한이 없는 요청입니다.",
  
  // Friend
  AlreadySendRequest = '이미 친구 요청을 보냈습니다.',
  AlreadyFriend = '이미 친구 상태입니다.',

  // Notification
  WrongNotiType = '잘못된 알림 타입입니다.',

  // Jwt
  JwtNotExpired = '만료되지 않은 토큰입니다.',
  JwtExpired = '만료된 토큰입니다.',
  NotValidToken = '유효하지 않은 토큰 입니다.',
  TokenMissing = '토큰이 없습니다.',
  RefreshExpire = '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.',
  UserAlreadyExists = '다른 계정으로 이미 가입된 사용자입니다.',
  FailedLogout = '로그아웃에 실패했습니다. 다시 시도해 주세요.',
  RedisServerError = '로그아웃을 처리하는 중에 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  InvalidUserType = '정회원이 아닙니다. 회원가입 후 이용해주세요.',
  // Default Images
  DefaultImgIdNotExist = '기본 이미지가 정의되어있지 않습니다.',
  DefaultImgNotExist = '기본 이미지를 찾을 수 없습니다.',

  // Account
  AccountNotFound = '계좌 정보가 없습니다.',

  // Address
  AddressNotFound = '배송지 정보가 없습니다.',

  // Validators
  InvalidUrl = '유효한 URL이 아닙니다.',
}
