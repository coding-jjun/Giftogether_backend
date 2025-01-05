import { ProvisionalDonationStatus } from 'src/enums/provisional-donation-status.enum';

export class ProvisionalDonationDto {
  constructor(
    readonly provDonId: number,
    readonly senderSig: string,
    readonly senderUserId: number,
    readonly amount: number,
    readonly fundUuid: string,
    readonly provDonStat: ProvisionalDonationStatus,
    readonly regAt: Date,
  ) {}
}
