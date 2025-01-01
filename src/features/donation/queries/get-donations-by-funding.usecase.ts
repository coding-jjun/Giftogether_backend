import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Donation } from 'src/entities/donation.entity';
import { Image } from 'src/entities/image.entity';
import { ImageType } from 'src/enums/image-type.enum';
import { Repository } from 'typeorm';

@Injectable()
export class GetDonationsByFundingUseCase {
  constructor(
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
  ) {}

  async execute(fundId: number, lastId?: number): Promise<Donation[]> {
    const query = this.donationRepo
      .createQueryBuilder('donation')
      .orderBy('donation.donId', 'DESC')
      .where('donation.funding = :fundId', { fundId })
      .leftJoinAndSelect('donation.user', 'user')
      .leftJoinAndMapOne(
        'user.image',
        Image,
        'image',
        `(user.defaultImgId = image.imgId OR
            (user.defaultImgId IS NULL
              AND image.subId = user.userId
              AND image.imgType = :userType))`,
        { userType: ImageType.User },
      );

    if (lastId) {
      query.andWhere('donation.donId < :lastId', { lastId });
    }

    query.take(10);

    const donations: Promise<Donation[]> = query.getMany();
    return donations;
  }
}
