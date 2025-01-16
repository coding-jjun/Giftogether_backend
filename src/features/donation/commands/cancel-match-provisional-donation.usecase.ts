import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProvisionalDonation } from '../../../entities/provisional-donation.entity';
import { Repository } from 'typeorm';
import { GiftogetherExceptions } from '../../../filters/giftogether-exception';
import { ProvisionalDonationFsmService } from '../domain/services/provisional-donation-fsm.service';
import { ProvisionalDonationMatchCancelledEvent } from '../domain/events/provisional-donation-match-cancelled.event';
import { InvalidStatus } from '../../../exceptions/invalid-status';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * 예비후원의 상태를 다시 Pending으로 변경하는 유스케이스입니다.
 */
@Injectable()
export class CancelMatchProvisionalDonationUseCase {
  constructor(
    @InjectRepository(ProvisionalDonation)
    private readonly provDonRepo: Repository<ProvisionalDonation>,
    private readonly g2gException: GiftogetherExceptions,
    private readonly provDonFsmService: ProvisionalDonationFsmService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * TODO - implement
   */
  async execute(provDonId: number, donorId: number, adminId: number) {
    const provDon = await this.provDonRepo.findOne({
      where: { provDonId },
    });

    if (!provDon) {
      throw this.g2gException.ProvisionalDonationNotFound;
    }

    const event = new ProvisionalDonationMatchCancelledEvent(provDon.senderSig);
    try {
      provDon.transition(event.name, this.provDonFsmService);
    } catch (error) {
      if (error instanceof InvalidStatus) {
        // 예비후원 매치취소 실패함.
      }
    }
  }
}
