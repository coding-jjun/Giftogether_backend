export enum ErrorCode {
  // Funding
  FundingNotExists = '0000',
  EndDatePast = '0001',

  // Donation
  FundingClosed = '0100',
  FundingNotClosed = '0101',

  // Gift
  IncorrectGiftUrl = '0200',
  GiftNotFound = '0201',

  // Gratitude
  GratitudeAlreadyExists = '0300',
  GratitudeNotExist = '0301',

  // RollingPaper

  // Comment
  CommentNotFound = "0500",

  // Image
  IncorrectImageUrl = '0600',
  IncorrectImageHost = '0601',
  ImageUriNotSpecified = '0602',
  ImageNotFound = '0603',
  ImageIntegrityError = '0604',
  ImageAlreadyExists = '0605',

  // User
  UserNotFound = '0700',
  UserNotUpdated = '0701',
  UserAlreadyDeleted = '0702',
  NotValidEmail = "0703",
  NotValidPhone = "0704",
  NotValidNick = "0705",
  PasswordIncorrect = "0706",
  UserFailedToCreate = '0707',
  UserAccessDenied = "0708",
  // Admin
  SnsLoginBlocked = "0710",

  // Friend
  AlreadySendRequest = '0800',
  AlreadyFriend = '0801',
  
  // Jwt
  JwtNotExpired = '0900',
  JwtExpired = '0901',
  NotValidToken = '0902',
  TokenMissing = '0903',
  RefreshExpire = '0904',
  UserAlreadyExists = '0905',
  FailedLogout = '0906',
  RedisServerError = '0907',
  InvalidUserType = '0908',
  
  // Default image
  DefaultImgIdNotExist = '1000',
  DefaultImgNotExist = '1001',
  
  // Account
  AccountNotFound = '1100',

  // Notification
  WrongNotiType = '1200',

  // Address
  AddressNotFound = '1300',

  // Validators
  InvalidUrl = '1400',
}
