import { Module } from '@nestjs/common';
import { DepositController } from './deposit.controller';
import { DepositService } from './deposit.service';
import { UploadDepositUseCase } from './commands/upload-deposit.usecase';
import { MatchDepositUseCase } from './commands/match-deposit.usecase';
import { GiftogetherExceptions } from '../../filters/giftogether-exception';
import { DepositEventHandler } from './domain/events/deposit-event.handler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Funding } from 'src/entities/funding.entity';
import { Notification } from 'src/entities/notification.entity';
import { User } from 'src/entities/user.entity';
import { Donation } from 'src/entities/donation.entity';
import { Deposit } from '../../entities/deposit.entity';
import { ProvisionalDonation } from '../../entities/provisional-donation.entity';
import { CreateDonationUseCase } from '../donation/commands/create-donation.usecase';
import { IncreaseFundSumUseCase } from '../funding/commands/increase-fundsum.usecase';
import { NotificationService } from '../notification/notification.service';
import { DecreaseFundSumUseCase } from '../funding/commands/decrease-fundsum.usecase';
import { FindAllAdminsUseCase } from '../admin/queries/find-all-admins.usecase';
import { DepositFsmService } from './domain/deposit-fsm.service';
import { EventModule } from '../event/event.module';

@Module({
  imports: [
    EventModule,
    TypeOrmModule.forFeature([
      Funding,
      Notification,
      User,
      Donation,
      Deposit,
      ProvisionalDonation,
    ]),
  ],
  controllers: [DepositController],
  providers: [
    DepositService,
    UploadDepositUseCase,
    MatchDepositUseCase,
    GiftogetherExceptions,
    DepositEventHandler,
    CreateDonationUseCase,
    IncreaseFundSumUseCase,
    DecreaseFundSumUseCase,
    NotificationService,
    FindAllAdminsUseCase,
    DepositFsmService,
  ],
})
export class DepositModule {}
