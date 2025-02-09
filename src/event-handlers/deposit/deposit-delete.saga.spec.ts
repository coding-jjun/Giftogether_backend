import { Test, TestingModule } from '@nestjs/testing';
import { DepositDeleteSaga } from './deposit-delete.saga';
import { Repository } from 'typeorm';
import { Deposit } from '../../entities/deposit.entity';
import { Donation } from '../../entities/donation.entity';
import { Funding } from '../../entities/funding.entity';
import { User } from '../../entities/user.entity';
import { ProvisionalDonation } from '../../entities/provisional-donation.entity';
import { DepositModule } from '../../features/deposit/deposit.module';
import { TestsModule } from 'src/tests/tests.module';

/**
 * TODO - 사전 작업을 먼저 끝내논 뒤에 테스트 코드 작성.
 * 1. 자동 인증 & 인가 유틸리티 구현
 * 2. Redis Configuration을 테스트 환경에서도 작동하게 만들거나 아예 Redis를 Mocking하는 방법 찾기
 */
describe('DepositDeleteSaga', () => {
  let module: TestingModule;
  let saga: DepositDeleteSaga;
  let depositRepo: Repository<Deposit>;
  let donationRepo: Repository<Donation>;
  let fundingRepo: Repository<Funding>;
  let userRepo: Repository<User>;
  let provDonRepo: Repository<ProvisionalDonation>;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [DepositModule, TestsModule],
      providers: [],
    }).compile();

    saga = module.get<DepositDeleteSaga>(DepositDeleteSaga);
    depositRepo = module.get<Repository<Deposit>>('DepositRepository');
    donationRepo = module.get<Repository<Donation>>('DonationRepository');
    fundingRepo = module.get<Repository<Funding>>('FundingRepository');
    userRepo = module.get<Repository<User>>('UserRepository');
    provDonRepo = module.get<Repository<ProvisionalDonation>>(
      'ProvisionalDonationRepository',
    );
  });

  afterAll(async () => {
    await module.close();
  });

  describe('handleMatchedDepositDeleteRequested', () => {
    it('should delete matched deposit and decrease funding sum', async () => {});
  });

  describe('handlePartiallyMatchedDepositDeleteRequested', () => {
    it('should cancel provisional donation match and delete deposit', async () => {});
  });
});
