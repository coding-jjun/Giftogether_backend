import { faker } from '@faker-js/faker/locale/ko';
import { User } from 'src/entities/user.entity';
import { Funding } from 'src/entities/funding.entity';
import { ProvisionalDonation } from 'src/entities/provisional-donation.entity';
import { Deposit } from 'src/entities/deposit.entity';
import { Donation } from 'src/entities/donation.entity';
import { Account } from 'src/entities/account.entity';
import { Address } from 'src/entities/address.entity';
import { Comment } from 'src/entities/comment.entity';
import { Image } from 'src/entities/image.entity';
import { Gift } from 'src/entities/gift.entity';
import { AuthType } from 'src/enums/auth-type.enum';
import { FundTheme } from 'src/enums/fund-theme.enum';
import { BankType } from 'src/enums/bank-type.enum';
import { ImageType } from 'src/enums/image-type.enum';
import { DonationStatus } from 'src/enums/donation-status.enum';
import { ProvisionalDonationStatus } from 'src/enums/provisional-donation-status.enum';
import { DepositStatus } from 'src/enums/deposit-status.enum';

// Interfaces
interface IMockUser {
  userId?: number;
  authId?: string;
  authType?: AuthType;
  userNick?: string;
  userPw?: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  userBirth?: Date;
  account?: Account;
  regAt?: Date;
  uptAt?: Date;
  delAt?: Date;
  fundings?: Funding[];
  comments?: Comment[];
  addresses?: Address[];
  defaultImgId?: number;
  createdImages?: Image[];
  image?: Image;
  isAdmin?: boolean;
}

interface IMockFunding {
  fundId?: number;
  fundUuid?: string;
  fundUser?: User;
  fundTitle?: string;
  fundCont?: string;
  fundTheme?: FundTheme;
  fundPubl?: boolean;
  fundGoal?: number;
  fundSum?: number;
  fundAddrRoad?: string;
  fundAddrDetl?: string;
  fundAddrZip?: string;
  fundRecvName?: string;
  fundRecvPhone?: string;
  fundRecvReq?: string;
  endAt?: Date;
  regAt?: Date;
  uptAt?: Date;
  comments?: Comment[];
  gifts?: Gift[];
  donations?: Donation[];
  provDons?: ProvisionalDonation[];
  defaultImgId?: number;
  image?: Image;
}

interface IMockProvisionalDonation {
  provDonId?: number;
  senderSig?: string;
  senderUser?: User;
  amount?: number;
  funding?: Funding;
  fundId?: number;
  status?: ProvisionalDonationStatus;
  regAt?: Date;
  delAt?: Date;
}

interface IMockDeposit {
  depositId?: number;
  donation?: Donation;
  senderSig?: string;
  receiver?: string;
  amount?: number;
  transferDate?: Date;
  depositBank?: string;
  depositAccount?: string;
  withdrawalAccount?: string;
  status?: DepositStatus;
  regAt?: Date;
  delAt?: Date;
}

interface IMockDonation {
  donId?: number;
  funding?: Funding;
  user?: User;
  deposit?: Deposit;
  donStat?: DonationStatus;
  orderId?: string;
  donAmnt?: number;
  regAt?: Date;
  delAt?: Date;
}

// Factory functions
export const createMockUser = (overwrites?: Partial<IMockUser>): User => {
  const defaultUser = {
    userId: faker.number.int(),
    authId: faker.string.alphanumeric(10),
    authType: AuthType.Jwt,
    userNick: faker.internet.userName(),
    userPw: faker.internet.password(),
    userName: faker.person.fullName(),
    userPhone: faker.helpers.fromRegExp('010-[0-9]{4}-[0-9]{4}'),
    userEmail: faker.internet.email(),
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

export const createMockFunding = (overwrites?: Partial<IMockFunding>): Funding => {
  const defaultFunding = {
    fundId: faker.number.int(),
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
  overwrites?: Partial<IMockProvisionalDonation>,
): ProvisionalDonation => {
  const defaultProvDonation = {
    provDonId: faker.number.int(),
    senderSig: `${faker.person.lastName()}-${faker.number.int({ min: 1000, max: 9999 })}`,
    amount: faker.number.int({ min: 1000, max: 100000 }),
    status: ProvisionalDonationStatus.Pending,
    regAt: faker.date.recent(),
  } as ProvisionalDonation;

  return {
    ...defaultProvDonation,
    ...overwrites,
  } as ProvisionalDonation;
};

export const createMockDeposit = (overwrites?: Partial<IMockDeposit>): Deposit => {
  const defaultDeposit = {
    depositId: faker.number.int(),
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

export const createMockDonation = (overwrites?: Partial<IMockDonation>): Donation => {
  const defaultDonation = {
    donId: faker.number.int(),
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
  overwrites?: Partial<IMockFunding>,
): Promise<Funding> => {
  const mockUser = createMockUser();
  const mockFunding = createMockFunding({
    fundUser: mockUser,
    ...overwrites,
  });

  // Create some mock donations
  const mockDonations = Array(3).fill(null).map(() => {
    const mockDeposit = createMockDeposit();
    return createMockDonation({
      funding: mockFunding,
      user: mockUser,
      deposit: mockDeposit,
    });
  });

  // Create some mock provisional donations
  const mockProvDonations = Array(2).fill(null).map(() =>
    createMockProvisionalDonation({
      funding: mockFunding,
      senderUser: mockUser,
    }),
  );

  mockFunding.donations = mockDonations;
  mockFunding.provDons = mockProvDonations;

  return mockFunding;
};

// Helper function to create a complete user with all relations
export const createMockUserWithRelations = async (
  overwrites?: Partial<IMockUser>,
): Promise<User> => {
  const mockUser = createMockUser(overwrites);
  
  // Create fundings for the user
  const mockFundings = Array(2).fill(null).map(() =>
    createMockFunding({
      fundUser: mockUser,
    }),
  );

  // Create addresses for the user
  const mockAddresses = Array(2).fill(null).map(() => ({
    addrId: faker.number.int(),
    addrUser: mockUser,
    addrNick: faker.word.noun(),
    addrRoad: faker.location.streetAddress(),
    addrDetl: faker.location.secondaryAddress(),
    addrZip: faker.location.zipCode(),
    recvName: faker.person.fullName(),
    recvPhone: faker.helpers.fromRegExp('010-[0-9]{4}-[0-9]{4}'),
    isDef: false,
  } as Address));

  mockUser.fundings = mockFundings;
  mockUser.addresses = mockAddresses;

  return mockUser;
};
