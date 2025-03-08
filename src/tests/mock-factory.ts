import { faker } from '@faker-js/faker/locale/ko';
import { User } from 'src/entities/user.entity';
import { Funding } from 'src/entities/funding.entity';
import { ProvisionalDonation } from 'src/entities/provisional-donation.entity';
import { Deposit } from 'src/entities/deposit.entity';
import { Donation } from 'src/entities/donation.entity';
import { Address } from 'src/entities/address.entity';
import { AuthType } from 'src/enums/auth-type.enum';
import { FundTheme } from 'src/enums/fund-theme.enum';
import { DonationStatus } from 'src/enums/donation-status.enum';
import { ProvisionalDonationStatus } from 'src/enums/provisional-donation-status.enum';
import { DepositStatus } from 'src/enums/deposit-status.enum';
import { Nickname } from '../util/nickname';
import { DonationService } from '../features/donation/donation.service';
import { CreateMockFundingWithRelationsDelegate } from './create-mock-funding-delegate.interface';
import { CreateMockUserDelegate } from './create-mock-user-delegate.interface';
import { Gift } from 'src/entities/gift.entity';

const baseNick = (): string => {
  const nickname = new Nickname();
  const adjectiveIndex = Math.floor(Math.random() * nickname.adjective.length);
  const nounIndex = Math.floor(Math.random() * nickname.noun.length);

  const adjective = nickname.adjective[adjectiveIndex];
  const noun = nickname.noun[nounIndex];

  const baseNick = `${adjective}${noun}`;

  return baseNick;
};

// Factory functions
export const createMockUser = (overwrites?: Partial<User>): User => {
  const userNick = baseNick();
  const userName = faker.person.fullName();
  const defaultUser = {
    authId: faker.string.alphanumeric(10),
    authType: AuthType.Jwt,
    userNick,
    userPw: faker.internet.password(),
    userName,
    userPhone: faker.helpers.fromRegExp('010-[0-9]{4}-[0-9]{4}'),
    userEmail: faker.internet.email({
      firstName: userName,
      allowSpecialCharacters: true,
    }),
    userBirth: faker.date.past(),
    regAt: faker.date.recent(),
    uptAt: faker.date.recent(),
    fundings: [],
    comments: [],
    addresses: [],
    isAdmin: false,
  } as User;

  return {
    ...defaultUser,
    ...overwrites,
  } as User;
};

export const createMockFunding = (overwrites?: Partial<Funding>): Funding => {
  const defaultFunding = {
    fundUuid: faker.string.uuid(),
    fundTitle: faker.commerce.productName(),
    fundCont: faker.lorem.paragraph(),
    fundTheme: FundTheme.Birthday,
    fundPubl: true,
    fundGoal: faker.number.int({ min: 10000, max: 1000000 }),
    fundSum: 0,
    fundAddrRoad: faker.location.streetAddress(),
    fundAddrDetl: faker.location.secondaryAddress(),
    fundAddrZip: faker.location.zipCode(),
    fundRecvName: faker.person.fullName(),
    fundRecvPhone: faker.helpers.fromRegExp('010-[0-9]{4}-[0-9]{4}'),
    fundRecvReq: faker.lorem.sentence(),
    endAt: faker.date.future(),
    regAt: faker.date.recent(),
    uptAt: faker.date.recent(),
    comments: [],
    gifts: [],
    donations: [],
    provDons: [],
  } as Funding;

  return {
    ...defaultFunding,
    ...overwrites,
  } as Funding;
};

export const createMockProvisionalDonation = (
  overwrites?: Partial<ProvisionalDonation>,
): ProvisionalDonation => {
  const defaultProvDonation = {
    senderSig: DonationService.createSenderSig(faker.person.fullName()),
    amount: faker.number.int({ min: 1000, max: 100000 }),
    regAt: faker.date.recent(),
  } as ProvisionalDonation;

  return {
    ...defaultProvDonation,
    ...overwrites,
  } as ProvisionalDonation;
};

export const createMockDeposit = (overwrites?: Partial<Deposit>): Deposit => {
  const defaultDeposit = {
    senderSig: `${faker.person.lastName()}-${faker.number.int({ min: 1000, max: 9999 })}`,
    receiver: 'GIFTOGETHER',
    amount: faker.number.int({ min: 1000, max: 100000 }),
    transferDate: faker.date.recent(),
    depositBank: faker.finance.accountName(),
    depositAccount: faker.finance.accountNumber(),
    withdrawalAccount: faker.finance.accountNumber(),
    _status: DepositStatus.Unmatched,
    regAt: faker.date.recent(),
  } as Deposit;

  return {
    ...defaultDeposit,
    ...overwrites,
  } as Deposit;
};

export const createMockDonation = (
  overwrites?: Partial<Donation>,
): Donation => {
  const defaultDonation = {
    donStat: DonationStatus.Donated,
    orderId: faker.string.alphanumeric(10),
    donAmnt: faker.number.int({ min: 1000, max: 100000 }),
    regAt: faker.date.recent(),
  } as Donation;

  return {
    ...defaultDonation,
    ...overwrites,
  } as Donation;
};

/**
 * 선물 객체를 생성합니다.
 */
export const createMockGift = (overwrites?: Partial<Gift>): Gift => {
  const defaultGift = {
    giftTitle: faker.commerce.productName(),
    giftUrl: faker.internet.url(),
    giftOrd: faker.number.int({ min: 1, max: 100 }),
    giftOpt: faker.lorem.sentence(),
    giftCont: faker.lorem.sentence().slice(0, 20),
  } as Gift;

  return {
    ...defaultGift,
    ...overwrites,
  } as Gift;
};

/**
 * 펀딩을 생성합니다. 옵션으로 예치, 프로비전 후원, 후원을 생성할 수 있습니다.
 *
 * @param delegate - TypeOrm Repository 인스턴스를 대리자로 활용, 테스트 데이터 생성과 저장을 수행합니다.
 * @param overwrites - 펀딩 엔티티의 속성을 오버라이드합니다.
 * @param amount - 예치, 프로비전 후원, 후원 생성 개수를 지정합니다. (후원 생성 시 예치 개수보다 많을 수 없습니다.)
 * @returns 생성된 펀딩 엔티티를 반환합니다.
 *
 * @example
 * const mockFunding = await createMockFundingWithRelations(
 * {
 *   userRepo,
 *   fundingRepo,
 *   depositRepo,
 *   donationRepo,
 *   provDonRepo,
 * },
 * {
 *   fundUser: mockFundingOwner,
 *   fundGoal: 1000000,
 * },
 * {
 *   deposit: 1,
 * },
 * );
 */
export const createMockFundingWithRelations = async (
  delegate: CreateMockFundingWithRelationsDelegate,
  overwrites?: Partial<Funding>,
  amount?: {
    deposit?: number;
    provDonation?: number;
    donation?: number;
    gift?: number;
  },
): Promise<Funding> => {
  if (
    amount &&
    amount.deposit &&
    amount.donation &&
    amount.deposit < amount.donation
  ) {
    throw new Error(
      'The number of deposits must be greater than or equal to the number of donations',
    );
  }
  // First save the user (strong entity)
  const mockUser = overwrites?.fundUser
    ? overwrites.fundUser
    : await delegate.userRepo.save(createMockUser());

  // Then create and save the funding (weak entity)
  const mockFunding = await delegate.fundingRepo.save(
    createMockFunding({
      fundUser: mockUser,
      ...overwrites,
    }),
  );

  // Handle optional deposits
  if (delegate.depositRepo) {
    const deposits = await delegate.depositRepo.save(
      Array(amount?.deposit ?? 1)
        .fill(null)
        .map(() => createMockDeposit()),
    );

    // Handle optional donations if deposits exist
    if (delegate.donationRepo) {
      const donations = await delegate.donationRepo.save(
        Array(amount?.donation ?? 1)
          .fill(null)
          .map((_, index) =>
            createMockDonation({
              funding: mockFunding,
              user: mockUser,
              deposit: deposits[index],
              donAmnt: deposits[index].amount,
            }),
          ),
      );

      // conform fundSum domain logic
      mockFunding.fundSum = donations.reduce(
        (acc, cur) => acc + cur.donAmnt,
        0,
      );

      // conform deposit status domain logic (related deposits are matched)
      for (const deposit of deposits.slice(0, donations.length)) {
        deposit._status = DepositStatus.Matched;
        await delegate.depositRepo.save(deposit);
      }

      mockFunding.donations = donations;
      await delegate.fundingRepo.save(mockFunding);
    }

    // Handle optional provisional donations
    if (delegate.provDonRepo) {
      await delegate.provDonRepo.save(
        Array(amount?.provDonation ?? 1)
          .fill(null)
          .map((_, index) =>
            createMockProvisionalDonation({
              funding: mockFunding,
              senderUser: mockUser,
              senderSig: deposits[index].senderSig,
            }),
          ),
      );
    }
  }

  // Handler optional gifts
  if (delegate.giftRepo) {
    const gifts = await delegate.giftRepo.save(
      Array(amount?.gift ?? 1)
        .fill(null)
        .map(() => createMockGift()),
    );

    mockFunding.gifts = gifts;
    await delegate.fundingRepo.save(mockFunding);
  }

  return mockFunding;
};

/**
 * 유저를 생성합니다. 옵션으로 펀딩, 주소를 생성할 수 있습니다.
 *
 * @param delegate - TypeOrm Repository 인스턴스를 대리자로 활용, 테스트 데이터 생성과 저장을 수행합니다.
 * @param overwrites - 유저 엔티티의 속성을 오버라이드합니다.
 * @param amount - 펀딩, 주소 생성 개수를 지정합니다.
 * @returns 생성된 유저 엔티티를 반환합니다.
 *
 * @example
 * const mockFundingOwner = await createMockUserWithRelations(
 * {
 *   userRepo,
 *   fundingRepo,
 * },
 * {
 *   userName: '펀딩주인',
 * },
 * {
 *   funding: 1,
 * },
 */
export const createMockUserWithRelations = async (
  delegate: CreateMockUserDelegate,
  overwrites?: Partial<User>,
  amount?: {
    funding?: number;
    address?: number;
  },
): Promise<User> => {
  // First save the user (strong entity)
  const mockUser = await delegate.userRepo.save(createMockUser(overwrites));

  // Create and save fundings (weak entities)
  const mockFundings = await Promise.all(
    Array(amount?.funding ?? 1)
      .fill(null)
      .map(() =>
        delegate.fundingRepo.save(
          createMockFunding({
            fundUser: mockUser,
          }),
        ),
      ),
  );
  mockUser.fundings = mockFundings;

  // Handle optional addresses
  if (delegate.addressRepo) {
    const mockAddresses = await Promise.all(
      Array(amount?.address ?? 1)
        .fill(null)
        .map(() =>
          delegate.addressRepo.save({
            addrUser: mockUser,
            addrNick: faker.word.noun(),
            addrRoad: faker.location.streetAddress(),
            addrDetl: faker.location.secondaryAddress(),
            addrZip: faker.location.zipCode(),
            recvName: faker.person.fullName(),
            recvPhone: faker.helpers.fromRegExp('010-[0-9]{4}-[0-9]{4}'),
            isDef: false,
          } as Address),
        ),
    );
    mockUser.addresses = mockAddresses;
  }

  return delegate.userRepo.save(mockUser);
};
