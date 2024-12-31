import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Donation } from 'src/entities/donation.entity';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { Repository } from 'typeorm';

@Injectable()
export class ApproveDonationUseCase {
  constructor(
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
    private readonly g2gException: GiftogetherExceptions,
  ) {}

  async execute(donId: number): Promise<void> {
    const foundDonation = await this.donationRepo.findOne({ where: { donId } });
    foundDonation.approve(this.g2gException);
  }
}
