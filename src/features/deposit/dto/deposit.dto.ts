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
    this.senderSig = deposit.senderSig;
    this.receiver = deposit.receiver;
    this.amount = deposit.amount;
    this.transferDate = deposit.transferDate;
    this.depositBank = deposit.depositBank;
    this.depositAccount = deposit.depositAccount;
    this.withdrawalAccount = deposit.withdrawalAccount;
    this.status = deposit.status;
    this.depositId = deposit.depositId;
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
