import { Injectable } from '@nestjs/common';
import { ProvisionalDonationFsmService } from '../services/provisional-donation-fsm.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { ProvisionalDonation } from 'src/entities/provisional-donation.entity';
import { Repository } from 'typeorm';
import { DepositMatchedEvent } from 'src/features/deposit/domain/events/deposit-matched.event';
import { DepositPartiallyMatchedEvent } from 'src/features/deposit/domain/events/deposit-partially-matched.event';
import { ProvisionalDonationApprovedEvent } from './provisional-donation-approved.event';
import { ProvisionalDonationPartiallyMatchedEvent } from './provisional-donation-partially-matched.event';

@Injectable()
export class ProvisionalDonationEventHandler {
  constructor(
    private readonly provDonFsmService: ProvisionalDonationFsmService,
    @InjectRepository(ProvisionalDonation)
    private readonly provDonRepo: Repository<ProvisionalDonation>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 예비후원의 상태를 ‘승인’으로 변경합니다.
   */
  @OnEvent(DepositMatchedEvent.name)
  async handleDepositMatched(event: DepositMatchedEvent) {
    const { provisionalDonation } = event;

    provisionalDonation.transition(
      DepositMatchedEvent.name,
      this.provDonFsmService,
    );

    await this.provDonRepo.save(provisionalDonation);

    this.eventEmitter.emit(ProvisionalDonationApprovedEvent.name, {
      provisionalDonation,
    });
  }

  /**
   * 예비후원의 상태를 ‘부분 매칭’으로 변경합니다.
   */
  @OnEvent(DepositPartiallyMatchedEvent.name)
  async handleDepositPartiallyMatched(event: DepositPartiallyMatchedEvent) {
    const { provDon } = event;

    provDon.transition(event.name, this.provDonFsmService);
    await this.provDonRepo.save(provDon);

    this.eventEmitter.emit(ProvisionalDonationPartiallyMatchedEvent.name, {
      provisionalDonation: provDon,
    });
  }
}
