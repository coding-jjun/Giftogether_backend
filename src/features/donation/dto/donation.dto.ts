import { Donation } from 'src/entities/donation.entity';
import { DonationStatus } from 'src/enums/donation-status.enum';

export class DonationDto {
  donId: number;
  // rollId: number;
  fundUuid: string;
  donUserId: number;
  orderId: string;
  donStat: DonationStatus;
  donAmnt: number;
  regAt: Date;
  senderSig: string;
  expirationDate: Date;

  constructor(donation: Donation) {
    this.donId = donation.donId;
    // this.rollId = rollId;
    this.fundUuid = donation.funding.fundUuid;
    this.donUserId = donation.user.userId;
    this.orderId = donation.orderId;
    this.donStat = donation.status;
    this.donAmnt = donation.amount;
    this.regAt = donation.regAt;
    this.senderSig = donation.senderSig;
    this.expirationDate = donation.expirationDate;
  }
}
