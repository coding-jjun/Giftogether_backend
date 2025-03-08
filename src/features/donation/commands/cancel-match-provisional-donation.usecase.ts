import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProvisionalDonation } from '../../../entities/provisional-donation.entity';
import { Repository } from 'typeorm';
import { GiftogetherExceptions } from '../../../filters/giftogether-exception';
import { ProvisionalDonationFsmService } from '../domain/services/provisional-donation-fsm.service';
import { ProvisionalDonationMatchCancelledEvent } from '../domain/events/provisional-donation-match-cancelled.event';
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
   * 예비후원 매치를 취소합니다. 이벤트를 발송하고, 상태를 변경합니다. 이 프로세스는 실패할 수 있습니다.
   * @throws ProvisionalDonationNotFound
   * @throws InvalidStatus
   */
  async execute(senderSig: string, depositId: number, adminId: number) {
    const provDon = await this.provDonRepo.findOne({
      where: { senderSig },
    });

    if (!provDon) {
      throw this.g2gException.ProvisionalDonationNotFound;
    }

    const event = new ProvisionalDonationMatchCancelledEvent(
      depositId,
      provDon.senderSig,
      adminId,
    );

    provDon.transition(event.name, this.provDonFsmService);

    await this.provDonRepo.save(provDon);
    this.eventEmitter.emit(event.name, event);
  }
}
