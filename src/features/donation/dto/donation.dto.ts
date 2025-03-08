import { DonationStatus } from 'src/enums/donation-status.enum';

export class DonationDto {
  constructor(
    public readonly donId: number,
    public readonly fundUuid: string,
    public readonly donUserId: number,
    public readonly orderId: string,
    public readonly donStat: DonationStatus,
    public readonly donAmnt: number,
    public readonly regAt: Date,
  ) {}
}
