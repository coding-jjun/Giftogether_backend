import { Injectable } from '@nestjs/common';
import { Deposit } from '../../../entities/deposit.entity';
import { DepositDto } from '../dto/deposit.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UploadDepositUseCase {
  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,
  ) {}

  async execute(depositData: DepositDto): Promise<Deposit> {
    const deposit = Deposit.create(
      depositData.senderSig,
      depositData.receiver,
      depositData.amount,
      depositData.transferDate,
      depositData.depositBank,
      depositData.depositAccount,
      depositData.withdrawalAccount,
    );

    await this.depositRepository.save(deposit);

    return deposit;
  }
}
