import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Donation } from 'src/entities/donation.entity';
import { Repository } from 'typeorm';
import { CreateDonationCommand } from './create-donation.command';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';

/**
 * 이 유스케이스가 호출되는 시점은 DepositMatched 이벤트가 발행된 직후로,
 * fundSum이 적용되는 것과 별개로 이루어진다.
 */
@Injectable()
export class CreateDonationUseCase {
  constructor(
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
    private readonly g2gException: GiftogetherExceptions,
  ) {}

  async execute(cmd: CreateDonationCommand): Promise<Donation> {
    const { funding, amount, senderUser, deposit } = cmd;
    const donation = Donation.create(
      funding,
      senderUser,
      deposit,
      amount,
      this.g2gException,
    );

    await this.donationRepo.save(donation);

    return donation;
  }
}
