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
import { ImageService } from '../image/image.service';
import { ImageModule } from '../image/image.module';
import { ImageInstanceManager } from '../image/image-instance-manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([Donation, RollingPaper, Funding, User, Image]),
    AuthModule,
    ImageModule,
  ],
  controllers: [DonationController],
  providers: [
    DonationService,
    RollingPaperService,
    GiftogetherExceptions,
    ValidCheck,
  ],
})
export class DonationModule {}
