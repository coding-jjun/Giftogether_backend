import { Injectable } from '@nestjs/common';
import { Donation } from '../../../entities/donation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftogetherExceptions } from '../../../filters/giftogether-exception';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DonationDeletedEvent } from '../domain/events/donation-deleted.event';
import { DonationFsmService } from '../domain/services/donation-fsm.service';

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

  /**
   * @throws DonationNotExists
   * @throws InvalidStatus
   */
  async execute(
    donId: number,
    adminId: number,
    depositId: number, // !FIXME - Event Sourcing 패턴 구현하여 불필요한 파라메터 제거 필요
  ): Promise<void> {
    const donation = await this.donationRepo.findOne({
      where: { donId },
      relations: { funding: true },
    });
    if (!donation) {
      throw this.g2gException.DonationNotExists;
    }

    const event = new DonationDeletedEvent(
      donation.donId,
      donation.userId,
      donation.funding.fundId,
      depositId,
      adminId,
    );

    donation.transition(event.name, this.donationFsmService);

    await this.donationRepo.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.save(donation); // 후원 상태 업데이트
        await transactionalEntityManager.softDelete(Donation, { donId }); // softDelete
      },
    );

    /**
     * 후원 삭제 성공!
     */
    this.eventEmitter.emit(event.name, event);
  }
}
