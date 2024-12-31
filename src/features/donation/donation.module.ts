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
import { ApproveDonationUseCase } from './commands/approve-donation.usecase';
import { RejectDonationUseCase } from './commands/reject-donation.usecase';
import { RelateDonationWithDepositUseCase } from './commands/relate-donation-with-deposit.usecase';
import { GetDonationBySenderSigUseCase } from './queries/get-donation-by-sender-sig.usecase';

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
    ApproveDonationUseCase,
    RejectDonationUseCase,
    RelateDonationWithDepositUseCase,
    GetDonationBySenderSigUseCase,
  ],
})
export class DonationModule {}
