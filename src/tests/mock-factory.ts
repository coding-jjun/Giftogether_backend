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
import { Repository } from 'typeorm';

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
    status: ProvisionalDonationStatus.Pending,
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
    status: DepositStatus.Unmatched,
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

// Helper function to create related entities with proper save order
export const createMockFundingWithRelations = async (
  delegate: {
    userRepo: Repository<User>;
    fundingRepo: Repository<Funding>;
    depositRepo?: Repository<Deposit>;
    donationRepo?: Repository<Donation>;
    provDonRepo?: Repository<ProvisionalDonation>;
  },
  overwrites?: Partial<Funding>,
  amount?: {
    deposit?: number;
    provDonation?: number;
    donation?: number;
  },
): Promise<Funding> => {
  // First save the user (strong entity)
  const mockUser = await delegate.userRepo.save(createMockUser());

  // Then create and save the funding (weak entity)
  const mockFunding = await delegate.fundingRepo.save(
    createMockFunding({
      fundUser: mockUser,
      ...overwrites,
    }),
  );

  // Handle optional deposits
  if (delegate.depositRepo) {
    const deposits = await Promise.all(
      Array(amount?.deposit ?? 1)
        .fill(null)
        .map(() => delegate.depositRepo.save(createMockDeposit())),
    );

    // Handle optional donations if deposits exist
    if (delegate.donationRepo) {
      const donations = await Promise.all(
        deposits.map((deposit) =>
          delegate.donationRepo.save(
            createMockDonation({
              funding: mockFunding,
              user: mockUser,
              deposit,
              donAmnt: deposit.amount,
            }),
          ),
        ),
      );
      // conform fundSum
      mockFunding.fundSum = donations.reduce((sum, donation) => sum + donation.donAmnt, 0);
      await delegate.fundingRepo.save(mockFunding);
    }
  }

  // Handle optional provisional donations
  if (delegate.provDonRepo) {
    await Promise.all(
      Array(amount?.provDonation ?? 1)
        .fill(null)
        .map(() =>
          delegate.provDonRepo.save(
            createMockProvisionalDonation({
              funding: mockFunding,
              senderUser: mockUser,
            }),
          ),
        ),
    );
  }

  return mockFunding;
};

export const createMockUserWithRelations = async (
  delegate: {
    userRepo: Repository<User>;
    fundingRepo: Repository<Funding>;
    addressRepo?: Repository<Address>;
  },
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
