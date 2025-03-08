import { Module } from '@nestjs/common';
import { DepositController } from './deposit.controller';
import { DepositService } from './deposit.service';
import { UploadDepositUseCase } from './commands/upload-deposit.usecase';
import { MatchDepositUseCase } from './commands/match-deposit.usecase';
import { GiftogetherExceptions } from '../../filters/giftogether-exception';
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
import { DeleteDepositUseCase } from './commands/delete-deposit.usecase';
import { RequestDeleteDepositUseCase } from './commands/request-delete-deposit.usecase';
import { AuthModule } from '../auth/auth.module';
import { DeleteDonationUseCase } from '../donation/commands/delete-donation.usecase';
import { DonationFsmService } from '../donation/domain/services/donation-fsm.service';
import { CancelMatchProvisionalDonationUseCase } from '../donation/commands/cancel-match-provisional-donation.usecase';
import { ProvisionalDonationFsmService } from '../donation/domain/services/provisional-donation-fsm.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Funding,
      Notification,
      User,
      Donation,
      Deposit,
      ProvisionalDonation,
    ]),
    AuthModule,
  ],
  controllers: [DepositController],
  providers: [
    DepositService,
    UploadDepositUseCase,
    MatchDepositUseCase,
    GiftogetherExceptions,
    CreateDonationUseCase,
    IncreaseFundSumUseCase,
    DecreaseFundSumUseCase,
    NotificationService,
    FindAllAdminsUseCase,
    DepositFsmService,
    DeleteDepositUseCase,
    RequestDeleteDepositUseCase,
    DonationFsmService,
    DeleteDonationUseCase,
    CancelMatchProvisionalDonationUseCase,
    ProvisionalDonationFsmService,
  ],
})
export class DepositModule {}
