import { Injectable, NotFoundException } from '@nestjs/common';
import { UploadDepositUseCase } from './commands/upload-deposit.usecase';
import { MatchDepositUseCase } from './commands/match-deposit.usecase';
import { DepositDto } from './dto/deposit.dto';
import { Deposit } from '../../entities/deposit.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DonationDto } from '../donation/dto/donation.dto';

@Injectable()
export class DepositService {
  constructor(
    private readonly uploadDepositUseCase: UploadDepositUseCase,
    private readonly matchDepositUseCase: MatchDepositUseCase,
    @InjectRepository(Deposit)
    private readonly depositRepo: Repository<Deposit>,
  ) {}

  async findAll(
    page: number,
    limit: number,
  ): Promise<{
    deposits: DepositDto[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const [deposits, total] = await this.depositRepo
      .createQueryBuilder('deposit')
      .leftJoinAndSelect('deposit.donation', 'donation')
      .leftJoinAndSelect('donation.funding', 'funding')
      .leftJoinAndSelect('funding.fundUser', 'fundUser')
      .leftJoinAndSelect('donation.user', 'user')
      .orderBy('deposit.regAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      deposits: deposits.map(
        (deposit) =>
          new DepositDto(
            deposit.senderSig,
            deposit.receiver,
            deposit.amount,
            deposit.transferDate,
            deposit.depositBank,
            deposit.depositAccount,
            deposit.withdrawalAccount,
            deposit.status,
            deposit.depositId,
          ),
      ),
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

    return new DepositDto(
      deposit.senderSig,
      deposit.receiver,
      deposit.amount,
      deposit.transferDate,
      deposit.depositBank,
      deposit.depositAccount,
      deposit.withdrawalAccount,
      deposit.status,
      deposit.depositId,
      deposit.donation
        ? new DonationDto(
            deposit.donation.donId,
            deposit.donation.funding.fundUuid,
            deposit.donation.user.userId,
            deposit.donation.orderId,
            deposit.donation.donStat,
            deposit.donation.donAmnt,
            deposit.donation.regAt,
          )
        : undefined,
    );
  }

  async uploadDeposit(depositData: DepositDto): Promise<DepositDto> {
    const deposit: Deposit =
      await this.uploadDepositUseCase.execute(depositData);

    await this.matchDepositUseCase.execute(deposit);

    return depositData;
  }
}
