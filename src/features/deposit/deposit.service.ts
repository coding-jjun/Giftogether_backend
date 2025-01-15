import { Injectable } from '@nestjs/common';
import { UploadDepositUseCase } from './commands/upload-deposit.usecase';
import { MatchDepositUseCase } from './commands/match-deposit.usecase';
import { DepositDto } from './dto/deposit.dto';
import { Deposit } from '../../entities/deposit.entity';
import { DeleteDepositUseCase } from './commands/delete-deposit.usecase';

@Injectable()
export class DepositService {
  constructor(
    private readonly uploadDepositUseCase: UploadDepositUseCase,
    private readonly matchDepositUseCase: MatchDepositUseCase,
    private readonly deleteDepositUseCase: DeleteDepositUseCase,
  ) {}

  async uploadDeposit(depositData: DepositDto): Promise<DepositDto> {
    const deposit: Deposit =
      await this.uploadDepositUseCase.execute(depositData);

    await this.matchDepositUseCase.execute(deposit);

    return depositData;
  }

  async deleteDeposit(depositId: number): Promise<DepositDto> {
    return await this.deleteDepositUseCase.execute(depositId);
  }
}
