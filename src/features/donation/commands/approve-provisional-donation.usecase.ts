import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProvisionalDonation } from 'src/entities/provisional-donation.entity';
import { ProvisionalDonationStatus } from 'src/enums/provisional-donation-status.enum';
import { IFsmService } from 'src/interfaces/fsm-service.interface';
import { Repository } from 'typeorm';
import { ApproveProvisionalDonationCommand } from './approve-provisional-donation.command';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { ProvisionalDonationApprovedEvent } from '../domain/events/provisional-donation-approved.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ApproveProvisionalDonationUsecase {
  constructor(
    @InjectRepository(ProvisionalDonation)
    private readonly provDonRepo: Repository<ProvisionalDonation>,
    private readonly fsmService: IFsmService<ProvisionalDonationStatus>,
    private readonly g2gException: GiftogetherExceptions,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: ApproveProvisionalDonationCommand) {
    const { senderSig } = command;
    const provDon = await this.provDonRepo.findOne({ where: { senderSig } });
    if (!provDon) {
      throw this.g2gException.ProvisionalDonationNotFound;
    }
    provDon.transition('approve', this.fsmService);
    await this.provDonRepo.save(provDon);

    this.eventEmitter.emit(
      ProvisionalDonationApprovedEvent.name,
      new ProvisionalDonationApprovedEvent(provDon.senderSig),
    );
  }
}
