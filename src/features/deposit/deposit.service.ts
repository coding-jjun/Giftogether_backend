import { Injectable, NotFoundException } from '@nestjs/common';
import { UploadDepositUseCase } from './commands/upload-deposit.usecase';
import { MatchDepositUseCase } from './commands/match-deposit.usecase';
import { DepositDto } from './dto/deposit.dto';
import { Deposit } from '../../entities/deposit.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestDeleteDepositUseCase } from './commands/request-delete-deposit.usecase';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UpdateDepositDto } from './dto/update-deposit.dto';

@Injectable()
export class DepositService {
  constructor(
    private readonly uploadDepositUseCase: UploadDepositUseCase,
    private readonly matchDepositUseCase: MatchDepositUseCase,
    private readonly requestDeleteDepositUseCase: RequestDeleteDepositUseCase,
    @InjectRepository(Deposit)
    private readonly depositRepo: Repository<Deposit>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    deposits: DepositDto[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const depositsQb = this.depositRepo
      .createQueryBuilder('deposit')
      .leftJoinAndSelect('deposit.donation', 'donation')
      .leftJoinAndSelect('donation.funding', 'funding')
      .leftJoinAndSelect('funding.fundUser', 'fundUser')
      .leftJoinAndSelect('donation.user', 'user')
      .orderBy('deposit.regAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [deposits, total] = await depositsQb.getManyAndCount();

    return {
      deposits: deposits.map((deposit) => new DepositDto(deposit)),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<DepositDto> {
    const deposit = await this.depositRepo
      .createQueryBuilder('deposit')
      .leftJoinAndSelect('deposit.donation', 'donation')
      .leftJoinAndSelect('donation.funding', 'funding')
      .leftJoinAndSelect('funding.fundUser', 'fundUser')
      .leftJoinAndSelect('donation.user', 'user')
      .where('deposit.depositId = :id', { id })
      .getOne();

    if (!deposit) {
      throw new NotFoundException('입금내역을 찾을 수 없습니다.');
    }

    return new DepositDto(deposit);
  }

  async uploadDeposit(depositData: CreateDepositDto): Promise<DepositDto> {
    const deposit: Deposit =
      await this.uploadDepositUseCase.execute(depositData);

    await this.matchDepositUseCase.execute(deposit);

    return new DepositDto(deposit);
  }

  async requestDeleteDeposit(id: number, adminId: number): Promise<void> {
    await this.requestDeleteDepositUseCase.execute(id, adminId);
  }

  async requestUpdateDeposit(
    id: number,
    updateDepositDto: UpdateDepositDto,
    userId: number,
  ): any {
    throw new Error('Method not implemented.');
  }
}
