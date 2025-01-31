import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import entities from 'src/entities/entities';
import { DepositDeleteSaga } from './deposit-delete.saga';
import { DepositEventHandler } from './deposit-event.handler';
import { DonationEventHandler } from './donation-event-handler';
import { ProvisionalDonationEventHandler } from './provisional-donation-event-handler';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { DeleteDonationUseCase } from 'src/features/donation/commands/delete-donation.usecase';
import { MatchDepositUseCase } from 'src/features/deposit/commands/match-deposit.usecase';
import { UploadDepositUseCase } from 'src/features/deposit/commands/upload-deposit.usecase';
import { DeleteDepositUseCase } from 'src/features/deposit/commands/delete-deposit.usecase';
import { FindAllAdminsUseCase } from 'src/features/admin/queries/find-all-admins.usecase';
import { CreateDonationUseCase } from 'src/features/donation/commands/create-donation.usecase';
import { DecreaseFundSumUseCase } from 'src/features/funding/commands/decrease-fundsum.usecase';
import { IncreaseFundSumUseCase } from 'src/features/funding/commands/increase-fundsum.usecase';
import { CreateNotificationsUseCase } from 'src/features/notification/commands/create-notifications.usecase';
import { CancelMatchProvisionalDonationUseCase } from 'src/features/donation/commands/cancel-match-provisional-donation.usecase';
import { ApproveProvisionalDonationUsecase } from 'src/features/donation/commands/approve-provisional-donation.usecase';
import { CreateProvisionalDonationUseCase } from 'src/features/donation/commands/create-provisional-donation.usecase';
import { GetDonationsByFundingUseCase } from 'src/features/donation/queries/get-donations-by-funding.usecase';
import { RequestDeleteDepositUseCase } from 'src/features/deposit/commands/request-delete-deposit.usecase';
import { NotificationService } from 'src/features/notification/notification.service';
import { ProvisionalDonationFsmService } from 'src/features/donation/domain/services/provisional-donation-fsm.service';
import { DepositFsmService } from 'src/features/deposit/domain/deposit-fsm.service';
import { DonationFsmService } from 'src/features/donation/domain/services/donation-fsm.service';

const usecases = [
  DeleteDonationUseCase,
  MatchDepositUseCase,
  UploadDepositUseCase,
  DeleteDepositUseCase,
  FindAllAdminsUseCase,
  CreateDonationUseCase,
  DecreaseFundSumUseCase,
  IncreaseFundSumUseCase,
  CreateNotificationsUseCase,
  CancelMatchProvisionalDonationUseCase,
  ApproveProvisionalDonationUsecase,
  CreateProvisionalDonationUseCase,
  GetDonationsByFundingUseCase,
  RequestDeleteDepositUseCase,
];

const services = [
  GiftogetherExceptions,
  NotificationService,
  ProvisionalDonationFsmService,
  DepositFsmService,
  DonationFsmService,
];

@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  providers: [
    DepositDeleteSaga,
    DepositEventHandler,
    DonationEventHandler,
    ProvisionalDonationEventHandler,
    ...usecases,
    ...services,
  ],
})
export class EventHandlersModule {}
