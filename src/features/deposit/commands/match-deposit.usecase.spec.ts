import { MatchDepositUseCase } from './match-deposit.usecase';
import { Deposit } from '../../../entities/deposit.entity';
import { ProvisionalDonation } from '../../../entities/provisional-donation.entity';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { DepositMatchedEvent } from '../domain/events/deposit-matched.event';
import { DepositUnmatchedEvent } from '../domain/events/deposit-unmatched.event';
import { DepositPartiallyMatchedEvent } from '../domain/events/deposit-partially-matched.event';
import { GiftogetherExceptions } from '../../../filters/giftogether-exception';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from 'src/entities/user.entity';
import { AuthType } from 'src/enums/auth-type.enum';
import { Funding } from 'src/entities/funding.entity';
import { FundTheme } from 'src/enums/fund-theme.enum';
import { ProvisionalDonationStatus } from 'src/enums/provisional-donation-status.enum';
import { Repository } from 'typeorm';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { createDataSourceOptions } from 'src/tests/data-source-options';
import { Account } from 'src/entities/account.entity';
import { Comment } from 'src/entities/comment.entity';
import { Address } from 'src/entities/address.entity';
import { Image } from 'src/entities/image.entity';
import { Gift } from 'src/entities/gift.entity';
import { Donation } from 'src/entities/donation.entity';
import { DepositFsmService } from '../domain/deposit-fsm.service';
import {
  createMockFundingWithRelations,
  createMockUser,
  createMockProvisionalDonation,
} from '../../../tests/mock-factory';
import { CsBoard } from '../../../entities/cs-board.entity';
import { CsComment } from '../../../entities/cs-comment.entity';

const entities = [
  ProvisionalDonation,
  Deposit,
  Funding,
  User,
  Account,
  Comment,
  Address,
  Image,
  Gift,
  Donation,
  CsBoard,
  CsComment,
];

describe('MatchDepositUseCase', () => {
  let provDonationRepository: Repository<ProvisionalDonation>;
  let fundingRepository: Repository<Funding>;
  let userRepository: Repository<User>;
  let matchDepositUseCase: MatchDepositUseCase;
  let eventEmitter: EventEmitter2;
  let g2gException: GiftogetherExceptions;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot(),
        TypeOrmModule.forRoot(createDataSourceOptions(entities)),
        TypeOrmModule.forFeature(entities),
      ],
      controllers: [],
      providers: [
        GiftogetherExceptions,
        MatchDepositUseCase,
        DepositFsmService,
      ],
    }).compile();

    matchDepositUseCase = module.get(MatchDepositUseCase);
    provDonationRepository = module.get<Repository<ProvisionalDonation>>(
      getRepositoryToken(ProvisionalDonation),
    );
    fundingRepository = module.get<Repository<Funding>>(
      getRepositoryToken(Funding),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    eventEmitter = module.get(EventEmitter2);
    g2gException = module.get(GiftogetherExceptions);

    const mockUser1 = createMockUser({
      userName: '홍길동',
    });
    const mockUser2 = createMockUser({
      userName: '김철수',
    });
    const mockUser3 = createMockUser({
      userName: '이영희',
    });
    const mockFundingOwner = createMockUser({
      userName: '펀딩주인',
    });
    await userRepository.insert([
      mockUser1,
      mockUser2,
      mockUser3,
      mockFundingOwner,
    ]);

    // Seed sample funding
    const mockFunding = await createMockFundingWithRelations(
      {
        userRepo: userRepository,
        fundingRepo: fundingRepository,
        provDonRepo: provDonationRepository,
      },
      {
        fundUser: mockFundingOwner,
        fundGoal: 1000000,
      },
      {
        deposit: 1,
      },
    );

    jest.spyOn(eventEmitter, 'emit'); // Spy on the `emit` method for assertions.

    // Seed sample donations
    await provDonationRepository.insert([
      createMockProvisionalDonation({
        senderSig: '홍길동-1234',
        senderUser: mockUser1,
        amount: 50000,
        funding: mockFunding,
      }),
      createMockProvisionalDonation({
        senderSig: '김철수-5678',
        senderUser: mockUser2,
        amount: 100000,
        funding: mockFunding,
      }),
      createMockProvisionalDonation({
        senderSig: '이영희-9012',
        senderUser: mockUser3,
        amount: 150000,
        funding: mockFunding,
      }),
    ]);
  });

  it('should be defined', () => {
    expect(provDonationRepository).toBeDefined();
    expect(matchDepositUseCase).toBeDefined();
    expect(eventEmitter).toBeDefined();
  });

  it('should match deposit with an exact sponsorship (Matched Case)', async () => {
    // Arrange
    const deposit = Deposit.create(
      '홍길동-1234',
      'Receiver Name',
      50000,
      new Date(),
      'Bank Name',
      'Deposit Account',
      'Withdrawal Account',
    );

    // Act
    await matchDepositUseCase.execute(deposit);

    const matchedSponsorship = await provDonationRepository.findOne({
      where: {
        senderSig: deposit.senderSig,
        amount: deposit.amount,
      },
    });

    expect(matchedSponsorship?.status).toBe(ProvisionalDonationStatus.Approved);

    // Assert
    expect(matchedSponsorship.status).toBe(ProvisionalDonationStatus.Approved);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      DepositMatchedEvent.name,
      expect.any(DepositMatchedEvent),
    );
  });

  it('should handle partial match (Partially Matched Case)', async () => {
    // Arrange
    const deposit = Deposit.create(
      '홍길동-1234',
      'Receiver Name',
      99999999, // Mismatched amount
      new Date(),
      'Bank Name',
      'Deposit Account',
      'Withdrawal Account',
    );

    // Act
    await expect(() => matchDepositUseCase.execute(deposit)).rejects.toThrow(
      g2gException.DepositPartiallyMatched,
    );

    // Assert
    const sponsorship = await provDonationRepository.findOne({
      where: {
        senderSig: deposit.senderSig,
        amount: deposit.amount,
      },
    });

    expect(sponsorship).toBeNull(); // No exact match found
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      DepositPartiallyMatchedEvent.name,
      expect.any(DepositPartiallyMatchedEvent),
    );
  });

  it('should handle unmatched deposit (Unmatched Case)', async () => {
    // Arrange
    const deposit = Deposit.create(
      '박영수-9999', // Non-existent sender
      'Receiver Name',
      50000,
      new Date(),
      'Bank Name',
      'Deposit Account',
      'Withdrawal Account',
    );

    // Act
    await expect(() => matchDepositUseCase.execute(deposit)).rejects.toThrow(
      g2gException.DepositUnmatched,
    );

    // Assert
    const sponsorship = await provDonationRepository.findOne({
      where: {
        senderSig: deposit.senderSig,
        amount: deposit.amount,
      },
    });

    expect(sponsorship).toBeNull(); // No match found
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      DepositUnmatchedEvent.name,
      expect.any(DepositUnmatchedEvent),
    );
  });

  it('should create a provdonation successfully when matched', async () => {
    // Arrange
    const deposit = Deposit.create(
      '홍길동-1234',
      'Receiver Name',
      50000,
      new Date(),
      'Bank Name',
      'Deposit Account',
      'Withdrawal Account',
    );

    // Act
    await matchDepositUseCase.execute(deposit);

    const matchedSponsorship = await provDonationRepository.findOne({
      where: {
        senderSig: deposit.senderSig,
        amount: deposit.amount,
      },
    });

    // Assert
    expect(matchedSponsorship?.status).toBe(ProvisionalDonationStatus.Approved);
    const donation = await provDonationRepository.findOne({
      where: {
        senderSig: deposit.senderSig,
        amount: deposit.amount,
      },
    });
    expect(donation).toBeDefined();
  });

  it('should not create a provdonation when partially matched', async () => {
    // Arrange
    const deposit = Deposit.create(
      '홍길동-1234',
      'Receiver Name',
      99999999, // Mismatched amount
      new Date(),
      'Bank Name',
      'Deposit Account',
      'Withdrawal Account',
    );

    // Act
    await expect(() => matchDepositUseCase.execute(deposit)).rejects.toThrow(
      g2gException.DepositPartiallyMatched,
    );

    // Assert
    const donation = await provDonationRepository.findOne({
      where: {
        senderSig: deposit.senderSig,
        amount: deposit.amount,
      },
    });
    expect(donation).toBeNull();
  });

  it('should not create a provdonation when unmatched', async () => {
    // Arrange
    const deposit = Deposit.create(
      '박영수-9999', // Non-existent sender
      'Receiver Name',
      50000,
      new Date(),
      'Bank Name',
      'Deposit Account',
      'Withdrawal Account',
    );

    // Act
    await expect(() => matchDepositUseCase.execute(deposit)).rejects.toThrow(
      g2gException.DepositUnmatched,
    );

    // Assert
    const donation = await provDonationRepository.findOne({
      where: {
        senderSig: deposit.senderSig,
        amount: deposit.amount,
      },
    });
    expect(donation).toBeNull();
  });
});
