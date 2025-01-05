import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProvisionalDonation } from '../domain/entities/provisional-donation.entity';
import { Repository } from 'typeorm';

/**
 * @deprecated 사유: 단순한 액티브 레코드는 TypeORM이 해결해주었다. 상대적으로 복잡한 query builder에만 유스케이스를 두는 것이 더 낫다.
 */
@Injectable()
export class FindProvDonationsBySenderSigUseCase {
  constructor(
    @InjectRepository(ProvisionalDonation)
    private readonly provDonRepo: Repository<ProvisionalDonation>,
  ) {}

  async execute(senderSig: string): Promise<ProvisionalDonation[]> {
    const provDonations = this.provDonRepo.find({ where: { senderSig } });

    return provDonations;
  }
}
