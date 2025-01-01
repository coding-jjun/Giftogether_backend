import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Funding } from 'src/entities/funding.entity';
import { Repository } from 'typeorm';
import { IncreaseFundSumCommand } from './increase-fundsum.command';

@Injectable()
export class IncreaseFundSumUseCase {
  constructor(
    @InjectRepository(Funding)
    private readonly fundingRepo: Repository<Funding>,
  ) {}

  async execute(cmd: IncreaseFundSumCommand) {
    const { funding, amount } = cmd;

    await this.fundingRepo
      .createQueryBuilder()
      .update(funding)
      .set({ fundSum: () => 'fundSum + :amount' })
      .setParameter('amount', amount)
      .where('fundId = :fundId', { fundId: funding.fundId })
      .execute();
  }
}
