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
    userId: faker.number.int({ min: 1, max: 1000000000 }),
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
    fundId: faker.number.int({ min: 1, max: 1000000000 }),
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
    provDonId: faker.number.int({ min: 1, max: 1000000000 }),
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
    depositId: faker.number.int({ min: 1, max: 1000000000 }),
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
    donId: faker.number.int({ min: 1, max: 1000000000 }),
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

// Helper function to create related entities
export const createMockFundingWithRelations = async (
  overwrites?: Partial<Funding>,
): Promise<Funding> => {
  const mockUser = createMockUser();
  const mockFunding = createMockFunding({
    fundUser: {
      userId: mockUser.userId,
    } as User,
    ...overwrites,
  });

  // Create some mock donations
  const mockDonations = Array(3)
    .fill(null)
    .map(() => {
      const mockDeposit = createMockDeposit();
      return createMockDonation({
        funding: {
          fundId: mockFunding.fundId,
        } as Funding,
        user: {
          userId: mockUser.userId,
        } as User,
        deposit: {
          depositId: mockDeposit.depositId,
        } as Deposit,
      });
    });

  // Create some mock provisional donations
  const mockProvDonations = Array(2)
    .fill(null)
    .map(() =>
      createMockProvisionalDonation({
        funding: {
          fundId: mockFunding.fundId,
        } as Funding,
        senderUser: {
          userId: mockUser.userId,
        } as User,
      }),
    );

  mockFunding.donations = mockDonations;
  mockFunding.provDons = mockProvDonations;

  return mockFunding;
};

// Helper function to create a complete user with all relations
export const createMockUserWithRelations = async (
  overwrites?: Partial<User>,
): Promise<User> => {
  const mockUser = createMockUser(overwrites);

  // Create fundings for the user
  const mockFundings = Array(2)
    .fill(null)
    .map(() =>
      createMockFunding({
        fundUser: {
          userId: mockUser.userId,
        } as User,
      }),
    );

  // Create addresses for the user
  const mockAddresses = Array(2)
    .fill(null)
    .map(
      () =>
        ({
          addrUser: mockUser,
          addrNick: faker.word.noun(),
          addrRoad: faker.location.streetAddress(),
          addrDetl: faker.location.secondaryAddress(),
          addrZip: faker.location.zipCode(),
          recvName: faker.person.fullName(),
          recvPhone: faker.helpers.fromRegExp('010-[0-9]{4}-[0-9]{4}'),
          isDef: false,
        }) as Address,
    );

  mockUser.fundings = mockFundings;
  mockUser.addresses = mockAddresses;

  return mockUser;
};
