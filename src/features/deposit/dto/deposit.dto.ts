import { DepositStatus } from '../../../enums/deposit-status.enum';
import { DonationDto } from '../../donation/dto/donation.dto';

export class DepositDto {
  constructor(
    public readonly senderSig: string,
    public readonly receiver: string,
    public readonly amount: number,
    public readonly transferDate: Date,
    public readonly depositBank: string,
    public readonly depositAccount: string,
    public readonly withdrawalAccount: string,
    public readonly status: DepositStatus,
    public readonly depositId: number,
    public readonly donation?: DonationDto,
  ) {}
}
