import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Funding } from 'src/entities/funding.entity';
import { Repository } from 'typeorm';
import { DecreaseFundSumCommand } from './decrease-fundsum.command';

@Injectable()
export class DecreaseFundSumUseCase {
  constructor(
    @InjectRepository(Funding)
    private readonly fundingRepo: Repository<Funding>,
  ) {}

  async execute(cmd: DecreaseFundSumCommand) {
    const { funding, amount } = cmd;

    await this.fundingRepo
      .createQueryBuilder()
      .update(funding)
      .set({ fundSum: () => 'fundSum - :amount' })
      .setParameter('amount', amount)
      .where('fundId = :fundId', { fundId: funding.fundId })
      .execute();
  }
}
