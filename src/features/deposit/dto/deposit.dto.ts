import { Deposit } from '../../../entities/deposit.entity';
import { DepositStatus } from '../../../enums/deposit-status.enum';
import { DonationDto } from '../../donation/dto/donation.dto';

export class DepositDto {
  senderSig: string;
  receiver: string;
  amount: number;
  transferDate: Date;
  depositBank: string;
  depositAccount: string;
  withdrawalAccount: string;
  status: DepositStatus;
  depositId: number;
  regAt: Date;
  donation?: DonationDto;

  constructor(deposit: Partial<Deposit>) {
    Object.assign(this, deposit);
    this.status = deposit.status;
    this.donation = deposit.donation
      ? new DonationDto(
          deposit.donation.donId,
          deposit.donation.funding.fundUuid,
          deposit.donation.user.userId,
          deposit.donation.orderId,
          deposit.donation.donStat,
          deposit.donation.donAmnt,
          deposit.donation.regAt,
        )
      : undefined;
  }
}
