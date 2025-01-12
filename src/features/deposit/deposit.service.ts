import { Injectable, NotFoundException } from '@nestjs/common';
import { UploadDepositUseCase } from './commands/upload-deposit.usecase';
import { MatchDepositUseCase } from './commands/match-deposit.usecase';
import { DepositDto } from './dto/deposit.dto';
import { Deposit } from '../../entities/deposit.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class DepositService {
  constructor(
    private readonly uploadDepositUseCase: UploadDepositUseCase,
    private readonly matchDepositUseCase: MatchDepositUseCase,
    @InjectRepository(Deposit)
    private readonly depositRepo: Repository<Deposit>,
  ) {}

  async findAll(page: number, limit: number): Promise<{
    deposits: Deposit[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const [deposits, total] = await this.depositRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        regAt: 'DESC',
      },
    });

    return {
      deposits,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Deposit> {
    const deposit = await this.depositRepo.findOne({
      where: { depositId: id },
    });

    if (!deposit) {
      throw new NotFoundException('입금내역을 찾을 수 없습니다.');
    }

    return deposit;
  }

  async uploadDeposit(depositData: DepositDto): Promise<DepositDto> {
    const deposit: Deposit =
      await this.uploadDepositUseCase.execute(depositData);

    await this.matchDepositUseCase.execute(deposit);

    return depositData;
  }
}
