import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProvisionalDonation } from 'src/features/deposit/domain/entities/provisional-donation.entity';
import { Repository } from 'typeorm';
import { CreateProvisionalDonationCommand } from './create-provisional-donation.command';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { User } from 'src/entities/user.entity';
import { Funding } from 'src/entities/funding.entity';

@Injectable()
export class CreateProvisionalDonationUseCase {
  constructor(
    @InjectRepository(ProvisionalDonation)
    private readonly provdonRepo: Repository<ProvisionalDonation>,
    private readonly g2gException: GiftogetherExceptions,
  ) {}
  async execute(
    cmd: CreateProvisionalDonationCommand,
  ): Promise<ProvisionalDonation> {
    const provdon = ProvisionalDonation.create(
      this.g2gException,
      cmd.senderSig,
      { userId: cmd.senderUserId } as User,
      cmd.amount,
      { fundId: cmd.fundId } as Funding,
    );
    await this.provdonRepo.insert(provdon);

    return provdon;
  }
}
