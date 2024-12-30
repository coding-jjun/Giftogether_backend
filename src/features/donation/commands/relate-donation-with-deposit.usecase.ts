import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Donation } from 'src/entities/donation.entity';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { Repository } from 'typeorm';

@Injectable()
export class RelateDonationWithDepositUseCase {
  constructor(
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
    private readonly g2gException: GiftogetherExceptions,
  ) {}

  async execute(senderSig: string, depositId: number): Promise<void> {
    const foundDonation = await this.donationRepo.findOne({
      where: { senderSig },
    });
    if (!foundDonation) {
      throw this.g2gException.DonationNotExists;
    }

    // Aggregate 메서드 호출
    foundDonation.relateToDeposit(depositId);

    await this.donationRepo.save(foundDonation);
  }
}
