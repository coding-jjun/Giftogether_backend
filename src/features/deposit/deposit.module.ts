import { Module } from '@nestjs/common';
import { DepositController } from './deposit.controller';
import { DepositService } from './deposit.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UploadDepositUseCase } from './commands/upload-deposit.usecase';
import { MatchDepositUseCase } from './commands/match-deposit.usecase';
import { GiftogetherExceptions } from '../../filters/giftogether-exception';
import { DepositEventHandler } from './domain/events/deposit-event.handler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Funding } from 'src/entities/funding.entity';
import { Notification } from 'src/entities/notification.entity';
import { User } from 'src/entities/user.entity';
import { Donation } from 'src/entities/donation.entity';
import { Deposit } from './domain/entities/deposit.entity';
import { IncreaseFundSumUseCase } from '../funding/commands/increase-fundsum.usecase';
import { NotificationService } from '../notification/notification.service';
import { DecreaseFundSumUseCase } from '../funding/commands/decrease-fundsum.usecase';
import { FindAllAdminsUseCase } from '../admin/queries/find-all-admins.usecase';
import { DonationService } from '../donation/donation.service';
import { ValidCheck } from 'src/util/valid-check';
import { RollingPaper } from 'src/entities/rolling-paper.entity';
import { RelateDonationWithDepositUseCase } from '../donation/commands/relate-donation-with-deposit.usecase';
import { ApproveDonationUseCase } from '../donation/commands/approve-donation.usecase';
import { RejectDonationUseCase } from '../donation/commands/reject-donation.usecase';
import { GetDonationBySenderSigUseCase } from '../donation/queries/get-donation-by-sender-sig.usecase';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([
      Funding,
      Notification,
      User,
      Donation,
      Deposit,
      RollingPaper,
    ]),
  ],
  controllers: [DepositController],
  providers: [
    DepositService,
    UploadDepositUseCase,
    MatchDepositUseCase,
    GiftogetherExceptions,
    DepositEventHandler,
    IncreaseFundSumUseCase,
    DecreaseFundSumUseCase,
    NotificationService,
    FindAllAdminsUseCase,
    DonationService,
    ValidCheck,
    RelateDonationWithDepositUseCase,
    ApproveDonationUseCase,
    RejectDonationUseCase,
    RelateDonationWithDepositUseCase,
    GetDonationBySenderSigUseCase,
  ],
})
export class DepositModule {}
