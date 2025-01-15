import { Account } from './account.entity';
import { Address } from './address.entity';
import { Comment } from './comment.entity';
import { CsBoard } from './cs-board.entity';
import { CsComment } from './cs-comment.entity';
import { Deposit } from './deposit.entity';
import { Donation } from './donation.entity';
import { GiftogetherError } from './error.entity';
import { Friend } from './friend.entity';
import { Funding } from './funding.entity';
import { Gift } from './gift.entity';
import { Gratitude } from './gratitude.entity';
import { Image } from './image.entity';
import { Notification } from './notification.entity';
import { OpenBankToken } from './open-bank-token.entity';
import { ProvisionalDonation } from './provisional-donation.entity';
import { RollingPaper } from './rolling-paper.entity';
import { User } from './user.entity';

export default [
  Account,
  User,
  Funding,
  Comment,
  Donation,
  RollingPaper,
  Notification,
  Friend,
  Address,
  Gratitude,
  Image,
  OpenBankToken,
  Account,
  Gift,
  GiftogetherError,
  Deposit,
  ProvisionalDonation,
  CsBoard,
  CsComment,
];
