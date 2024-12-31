import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Donation } from 'src/entities/donation.entity';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { Repository } from 'typeorm';

@Injectable()
export class RejectDonationUseCase {
  constructor(
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
    private readonly g2gException: GiftogetherExceptions,
  ) {}
  async execute(donId: number): Promise<void> {
    const foundDonation = await this.donationRepo.findOne({ where: { donId } });
    if (!foundDonation) {
      throw this.g2gException.DonationNotExists;
    }
    foundDonation.reject(this.g2gException);
    await this.donationRepo.save(foundDonation);
  }
}
