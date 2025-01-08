import { User } from 'src/entities/user.entity';
import { Funding } from 'src/entities/funding.entity';
import { Deposit } from 'src/entities/deposit.entity';

export class CreateDonationCommand {
  constructor(
    readonly funding: Funding,
    readonly amount: number,
    readonly senderUser: User,
    readonly deposit: Deposit,
  ) {}
}
