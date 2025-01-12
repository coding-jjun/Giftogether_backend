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
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DepositFsmService } from '../domain/deposit-fsm.service';
import { ProvisionalDonationEventHandler } from '../../../features/donation/domain/events/provisional-donation-event-handler';
import { ProvisionalDonationFsmService } from '../../../features/donation/domain/services/provisional-donation-fsm.service';
import { createMockRepository } from '../../../tests/create-mock-repository';
import { EventModule } from '../../event/event.module';
import { DepositEventHandler } from '../domain/events/deposit-event.handler';
import { DepositModule } from '../deposit.module';

describe('MatchDepositUseCase', () => {
  let provDonationRepository: Repository<ProvisionalDonation>;
  let matchDepositUseCase: MatchDepositUseCase;
  let eventEmitter: EventEmitter2;
  let g2gException: GiftogetherExceptions;
  let mockUser: User;
  let mockFunding: Funding;
  let depositRepository: Repository<Deposit>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventModule],
      providers: [
        MatchDepositUseCase,
        DepositFsmService,
        GiftogetherExceptions,
        {
          provide: getRepositoryToken(Deposit),
          useValue: createMockRepository(Repository<Deposit>),
        },
        {
          provide: getRepositoryToken(ProvisionalDonation),
          useValue: createMockRepository(Repository<ProvisionalDonation>),
        },
      ],
    }).compile();

    matchDepositUseCase = module.get<MatchDepositUseCase>(MatchDepositUseCase);
    provDonationRepository = module.get<Repository<ProvisionalDonation>>(
      getRepositoryToken(ProvisionalDonation),
    );
    depositRepository = module.get<Repository<Deposit>>(getRepositoryToken(Deposit));
    g2gException = module.get<GiftogetherExceptions>(GiftogetherExceptions);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // Setup mock data
    mockUser = {
      userId: 1,
      authId: 'mockUser',
      authType: AuthType.Jwt,
      userNick: 'mockUser',
      userPw: 'password',
      userName: '홍길동',
      userPhone: '010-1234-5678',
      userBirth: new Date('1997-09-26'),
      userEmail: 'mockuser@example.com',
      isAdmin: false,
    } as User;

    mockFunding = {
      fundId: 1,
      fundUser: mockUser,
      fundTitle: 'mockFunding',
      fundCont: 'mockFunding',
      fundGoal: 1000000,
      endAt: new Date('9999-12-31'),
      fundTheme: FundTheme.Birthday,
    } as Funding;

    jest.spyOn(eventEmitter, 'emit');
  });

  it('should be defined', () => {
    expect(matchDepositUseCase).toBeDefined();
    expect(eventEmitter).toBeDefined();
  });

  it('should have same identity', () => {
    expect(matchDepositUseCase['eventEmitter']).toBe(eventEmitter);
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

    const mockProvDonation = ProvisionalDonation.create(
      g2gException,
      '홍길동-1234',
      mockUser,
      50000,
      mockFunding,
    );

    jest
      .spyOn(provDonationRepository, 'findOne')
      .mockResolvedValue(mockProvDonation);

    // Act
    await matchDepositUseCase.execute(deposit);

    // Assert
    expect(depositRepository.save).toHaveBeenCalledWith(deposit);
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
      99999999,
      new Date(),
      'Bank Name',
      'Deposit Account',
      'Withdrawal Account',
    );

    const mockProvDonation = ProvisionalDonation.create(
      g2gException,
      '홍길동-1234',
      mockUser,
      50000, // Different amount
      mockFunding,
    );

    jest
      .spyOn(provDonationRepository, 'findOne')
      .mockResolvedValue(mockProvDonation);

    // Act & Assert
    await expect(() => matchDepositUseCase.execute(deposit)).rejects.toThrow(
      g2gException.DepositPartiallyMatched,
    );

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      DepositPartiallyMatchedEvent.name,
      expect.any(DepositPartiallyMatchedEvent),
    );
  });

  it('should handle unmatched deposit (Unmatched Case)', async () => {
    // Arrange
    const deposit = Deposit.create(
      '박영수-9999',
      'Receiver Name',
      50000,
      new Date(),
      'Bank Name',
      'Deposit Account',
      'Withdrawal Account',
    );

    // Act & Assert
    await expect(() => matchDepositUseCase.execute(deposit)).rejects.toThrow(
      g2gException.DepositUnmatched,
    );

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      DepositUnmatchedEvent.name,
      expect.any(DepositUnmatchedEvent),
    );
  });
});
