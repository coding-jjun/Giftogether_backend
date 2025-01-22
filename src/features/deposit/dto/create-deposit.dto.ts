import { IsDate, IsNumber, IsString } from 'class-validator';

export class CreateDepositDto {
  @IsString()
  senderSig: string;

  @IsString()
  receiver: string;

  @IsNumber()
  amount: number;

  @IsDate()
  transferDate: Date;

  @IsString()
  depositBank: string;

  @IsString()
  depositAccount: string;

  @IsString()
  withdrawalAccount: string;

  @IsNumber()
  depositId: number;
}
