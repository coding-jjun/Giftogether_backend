import { Module } from '@nestjs/common';
import { DonationController } from './donation.controller';
import { DonationService } from './donation.service';
import { RollingPaperService } from '../rolling-paper/rolling-paper.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Donation } from 'src/entities/donation.entity';
import { RollingPaper } from 'src/entities/rolling-paper.entity';
import { Funding } from 'src/entities/funding.entity';
import { User } from 'src/entities/user.entity';
import { Image } from 'src/entities/image.entity';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { AuthModule } from '../auth/auth.module';
import { ValidCheck } from 'src/util/valid-check';
import { ImageModule } from '../image/image.module';
import { CreateProvisionalDonationUseCase } from './commands/create-provisional-donation.usecase';
import { ProvisionalDonation } from '../../entities/provisional-donation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Donation,
      RollingPaper,
      Funding,
      User,
      Image,
      ProvisionalDonation,
    ]),
    AuthModule,
    ImageModule,
  ],
  controllers: [DonationController],
  providers: [
    CreateProvisionalDonationUseCase,
    DonationService,
    RollingPaperService,
    GiftogetherExceptions,
    ValidCheck,
  ],
})
export class DonationModule {}
