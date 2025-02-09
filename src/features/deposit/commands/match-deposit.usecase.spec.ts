import { MatchDepositUseCase } from './match-deposit.usecase';
import { Deposit } from '../../../entities/deposit.entity';
import { ProvisionalDonation } from '../../../entities/provisional-donation.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DepositMatchedEvent } from '../domain/events/deposit-matched.event';
import { DepositUnmatchedEvent } from '../domain/events/deposit-unmatched.event';
import { DepositPartiallyMatchedEvent } from '../domain/events/deposit-partially-matched.event';
import { GiftogetherExceptions } from '../../../filters/giftogether-exception';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DepositFsmService } from '../domain/deposit-fsm.service';
import { ProvisionalDonationEventHandler } from 'src/event-handlers/provisional-donation/provisional-donation-event-handler';
import { ProvisionalDonationFsmService } from '../../../features/donation/domain/services/provisional-donation-fsm.service';
import { createMockRepository } from '../../../tests/create-mock-repository';
import { EventModule } from '../../event/event.module';
import {
  createMockDeposit,
  createMockProvisionalDonation,
  createMockUser,
} from '../../../tests/mock-factory';

describe('MatchDepositUseCase', () => {
  let provDonationRepository: Repository<ProvisionalDonation>;
  let matchDepositUseCase: MatchDepositUseCase;
  let eventEmitter: EventEmitter2;
  let g2gException: GiftogetherExceptions;
  let provDonEventHandler: ProvisionalDonationEventHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventModule],
      providers: [
        MatchDepositUseCase,
        DepositFsmService,
        ProvisionalDonationEventHandler,
        ProvisionalDonationFsmService,
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
    g2gException = module.get<GiftogetherExceptions>(GiftogetherExceptions);
    provDonEventHandler = module.get<ProvisionalDonationEventHandler>(
      ProvisionalDonationEventHandler,
    );
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    jest.spyOn(provDonEventHandler['eventEmitter'], 'emit');
    jest.spyOn(provDonEventHandler, 'handleDepositMatched');
    jest.spyOn(provDonEventHandler, 'handleDepositPartiallyMatched');
  });

  it('should be defined', () => {
    expect(matchDepositUseCase).toBeDefined();
    expect(eventEmitter).toBeDefined();
    expect(provDonEventHandler).toBeDefined();
  });

  it('should have same identity', () => {
    expect(matchDepositUseCase['eventEmitter']).toBe(eventEmitter);
  });

  it('should match deposit with an exact sponsorship (Matched Case)', async () => {
    // Arrange
    const mockUser = createMockUser();
    const amount = 50000;
    const senderSig = '홍길동-1234';

    const deposit = createMockDeposit({
      senderSig,
      amount,
    });
    deposit.transition = jest.fn();

    const mockProvDonation = createMockProvisionalDonation({
      senderSig,
      amount,
      senderUser: mockUser,
    });

    jest
      .spyOn(provDonationRepository, 'findOne')
      .mockResolvedValue(mockProvDonation);
    jest
      .spyOn(provDonationRepository, 'save')
      .mockResolvedValue(mockProvDonation);

    const emitSpy = jest.spyOn(provDonEventHandler['eventEmitter'], 'emit');

    // Act
    await matchDepositUseCase.execute(deposit);

    // Assert
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      DepositMatchedEvent.name,
      expect.any(DepositMatchedEvent),
    );
  });

  it('should handle partial match (Partially Matched Case)', async () => {
    // Arrange
    const mockUser = createMockUser();
    const senderSig = '홍길동-1234';
    const depositAmount = 99999999;
    const provDonationAmount = 50000;

    const deposit = createMockDeposit({
      senderSig,
      amount: depositAmount,
    });

    const mockProvDonation = createMockProvisionalDonation({
      senderSig,
      amount: provDonationAmount,
      senderUser: mockUser,
    });

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
    const deposit = createMockDeposit({
      senderSig: '박영수-9999',
      amount: 50000,
    });
    deposit.transition = jest.fn();

    jest.spyOn(provDonationRepository, 'findOne').mockResolvedValue(null);

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
