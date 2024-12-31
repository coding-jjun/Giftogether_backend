import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Donation } from 'src/entities/donation.entity';
import { FindOptionsRelations, Repository } from 'typeorm';

/**
 * 복잡해 보이지 않는 쿼리 로직도 유스케이스로 빼놓은 이유는 Donation과 밀접한 일관성이 없는 모듈에서 Repository<Donation>을
 * 주입하지 않기 위해서입니다. Repository를 주입하는 순간 엔티티 상태변화를 가능하게 만들기 때문에 읽기로직만 필요한 경우
 * 읽기만 허용하도록 만들어야 합니다.
 *
 * TODO: 이 유스케이스는 사실 너무 단순해서 donation.service의 메서드로 옮겨가도 문제는 없을 것 같습니다. 하지만 현재
 * donation.service가 의존하는 서비스가 많기 때문에 해당 서비스를 리팩터링 한 뒤에 추후 논의해 보도록 합시다.
 */
@Injectable()
export class GetDonationBySenderSigUseCase {
  constructor(
    @InjectRepository(Donation)
    private readonly repo: Repository<Donation>,
  ) {}

  /**
   * @param relations TypeORM find 메서드를 사용할때 join을 위해 사용하는 relations 입니다.
   * eager loading을 피하기 위해 선택적으로 funding, user 등을 조인할 수 있습니다.
   */
  async execute(
    senderSig: string,
    relations: FindOptionsRelations<Donation>,
  ): Promise<Donation> {
    return this.repo.findOne({ where: { senderSig }, relations });
  }
}
