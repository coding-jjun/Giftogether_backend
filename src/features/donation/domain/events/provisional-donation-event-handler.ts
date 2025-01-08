import { Injectable } from '@nestjs/common';
import { ProvisionalDonationFsmService } from '../services/provisional-donation-fsm.service';
import { OnEvent } from '@nestjs/event-emitter';
import { ProvisionalDonationApprovedEvent } from './provisional-donation-approved.event';
import { InjectRepository } from '@nestjs/typeorm';
import { ProvisionalDonation } from 'src/entities/provisional-donation.entity';
import { Repository } from 'typeorm';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { ProvisionalDonationPartiallyMatchedEvent } from './provisional-donation-partially-matched.event';

@Injectable()
export class ProvisionalDonationEventHandler {
  constructor(
    private readonly provDonFsmService: ProvisionalDonationFsmService,
    @InjectRepository(ProvisionalDonation)
    private readonly provDonRepo: Repository<ProvisionalDonation>,
    private readonly g2gException: GiftogetherExceptions,
  ) {}

  @OnEvent(ProvisionalDonationApprovedEvent.name)
  async handleProvisionalDonationApproved(
    event: ProvisionalDonationApprovedEvent,
  ) {
    const { senderSig } = event;

    const provDon = await this.provDonRepo.findOne({
      where: { senderSig },
    });

    if (!provDon) {
      throw this.g2gException.ProvisionalDonationNotFound;
    }

    provDon.transition(
      ProvisionalDonationApprovedEvent.name,
      this.provDonFsmService,
    );

    await this.provDonRepo.save(provDon);
  }

  @OnEvent(ProvisionalDonationPartiallyMatchedEvent.name)
  async handleProvisionalDonationPartiallyMatched(
    event: ProvisionalDonationPartiallyMatchedEvent,
  ) {
    const { senderSig } = event;

    const provDon = await this.provDonRepo.findOne({
      where: { senderSig },
    });

    if (!provDon) {
      throw this.g2gException.ProvisionalDonationNotFound;
    }

    provDon.transition(event.name, this.provDonFsmService);
    await this.provDonRepo.save(provDon);
  }
}
