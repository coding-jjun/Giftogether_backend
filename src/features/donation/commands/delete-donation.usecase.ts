import { Injectable } from '@nestjs/common';
import { Donation } from '../../../entities/donation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftogetherExceptions } from '../../../filters/giftogether-exception';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DonationDeletedEvent } from '../domain/events/donation-deleted.event';
import { DonationFsmService } from '../domain/services/donation-fsm.service';
import { DonationDeleteFailedEvent } from '../domain/events/donation-delete-failed.event';

/**
 * 후원 삭제 요청을 처리하는 유스케이스입니다.
 * 후원 삭제에 실패할 경우, 후원 삭제 실패 이벤트를 발행합니다.
 */
@Injectable()
export class DeleteDonationUseCase {
  constructor(
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
    private readonly donationFsmService: DonationFsmService,
    private readonly eventEmitter: EventEmitter2,
    private readonly g2gException: GiftogetherExceptions,
  ) {}

  async execute(donId: number, adminId: number): Promise<boolean> {
    const donation = await this.donationRepo.findOne({
      where: { donId },
    });
    if (!donation) {
      throw this.g2gException.DonationNotExists;
    }

    const event = new DonationDeletedEvent(
      donation.donId,
      donation.userId,
      donation.funding.fundId,
    );
    try {
      donation.transition(event.name, this.donationFsmService);
    } catch (error) {
      /**
       * 후원 삭제에 실패함! 보상절차를 시작합니다.
       */
      const event = new DonationDeleteFailedEvent(
        donation.donId,
        donation.userId,
        adminId,
      );
      this.eventEmitter.emit(DonationDeleteFailedEvent.name, event);
      return false;
    }

    await this.donationRepo.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.save(donation); // 후원 상태 업데이트
        await transactionalEntityManager.softDelete(Donation, { donId }); // softDelete
      },
    );
    return true;
  }
}
