import { Module } from '@nestjs/common';
import { FundingController } from './funding.controller';
import { FundingService } from './funding.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Funding } from 'src/entities/funding.entity';
import { User } from 'src/entities/user.entity';
import { Comment } from 'src/entities/comment.entity';
import { Friend } from 'src/entities/friend.entity';
import { GiftService } from '../gift/gift.service';
import { Gift } from 'src/entities/gift.entity';
import { Image } from 'src/entities/image.entity';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { FundingTasksService } from './funding.tasks.service';
import { Notification } from 'src/entities/notification.entity';
import { DonationService } from '../donation/donation.service';
import { Donation } from 'src/entities/donation.entity';
import { RollingPaper } from 'src/entities/rolling-paper.entity';
import { RollingPaperService } from '../rolling-paper/rolling-paper.service';
import { ValidCheck } from 'src/util/valid-check';
import { AuthModule } from '../auth/auth.module';
import { ImageService } from '../image/image.service';
import { S3Service } from '../image/s3.service';
import { ImageInstanceManager } from '../image/image-instance-manager';
import { IncreaseFundSumUseCase } from './commands/increase-fundsum.usecase';
import { ProvisionalDonation } from '../../entities/provisional-donation.entity';
import { CreateProvisionalDonationUseCase } from '../donation/commands/create-provisional-donation.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Funding,
      User,
      Comment,
      Friend,
      Gift,
      Image,
      Notification,
      Donation,
      RollingPaper,
      ProvisionalDonation,
    ]),
    AuthModule,
  ],
  controllers: [FundingController],
  providers: [
    FundingService,
    GiftService,
    DonationService,
    RollingPaperService,
    GiftogetherExceptions,
    FundingTasksService,
    ValidCheck,
    ImageService,
    S3Service,
    ImageInstanceManager,
    IncreaseFundSumUseCase,
    CreateProvisionalDonationUseCase,
  ],
  exports: [FundingService],
})
export class FundingModule {}
