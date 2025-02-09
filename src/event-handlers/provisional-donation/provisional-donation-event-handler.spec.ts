import { Test, TestingModule } from '@nestjs/testing';
import { ProvisionalDonationEventHandler } from './provisional-donation-event-handler';
import { ProvisionalDonationFsmService } from 'src/features/donation/domain/services/provisional-donation-fsm.service';
import { ProvisionalDonation } from 'src/entities/provisional-donation.entity';
import { Repository } from 'typeorm';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProvisionalDonationStatus } from 'src/enums/provisional-donation-status.enum';
import { User } from 'src/entities/user.entity';
import { Funding } from 'src/entities/funding.entity';
import { DepositMatchedEvent } from 'src/features/deposit/domain/events/deposit-matched.event';
import { Deposit } from 'src/entities/deposit.entity';
import { DepositPartiallyMatchedEvent } from 'src/features/deposit/domain/events/deposit-partially-matched.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventModule } from 'src/features/event/event.module';
import { ProvisionalDonationApprovedEvent } from 'src/features/donation/domain/events/provisional-donation-approved.event';
import { ProvisionalDonationPartiallyMatchedEvent } from 'src/features/donation/domain/events/provisional-donation-partially-matched.event';

describe('ProvisionalDonationEventHandler', () => {
  let handler: ProvisionalDonationEventHandler;
  let fsmService: ProvisionalDonationFsmService;
  let provDonRepo: Repository<ProvisionalDonation>;
  let g2gException: GiftogetherExceptions;
  let mockUser: User;
  let mockFunding: Funding;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventModule],
      providers: [
        ProvisionalDonationEventHandler,
        ProvisionalDonationFsmService,
        GiftogetherExceptions,
        EventEmitter2,
        {
          provide: getRepositoryToken(ProvisionalDonation),
          useClass: Repository,
        },
      ],
    }).compile();

    handler = module.get<ProvisionalDonationEventHandler>(
      ProvisionalDonationEventHandler,
    );
    fsmService = module.get<ProvisionalDonationFsmService>(
      ProvisionalDonationFsmService,
    );
    provDonRepo = module.get<Repository<ProvisionalDonation>>(
      getRepositoryToken(ProvisionalDonation),
    );
    g2gException = module.get<GiftogetherExceptions>(GiftogetherExceptions);

    // Setup mock data
    mockUser = {
      userId: 1,
      userNick: 'testUser',
    } as User;

    mockFunding = {
      fundId: 1,
      fundGoal: 10000,
    } as Funding;
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handleProvisionalDonationApproved', () => {
    it('should transition provisional donation to Approved state', async () => {
      // Create a provisional donation
      const provDon = ProvisionalDonation.create(
        g2gException,
        'test-sig',
        mockUser,
        1000,
        mockFunding,
      );

      // Mock repository findOne
      jest.spyOn(provDonRepo, 'findOne').mockResolvedValue(provDon);

      // Mock repository save
      jest.spyOn(provDonRepo, 'save').mockResolvedValue(provDon);

      // Mock event emitter
      const emitSpy = jest.spyOn(handler['eventEmitter'], 'emit');

      // Create and handle the event
      const event = new DepositMatchedEvent({} as Deposit, provDon);
      await handler.handleDepositMatched(event);

      // Verify the state transition
      expect(provDon.status).toBe(ProvisionalDonationStatus.Approved);
      expect(provDonRepo.save).toHaveBeenCalledWith(provDon);

      // Verify event was emitted
      expect(emitSpy).toHaveBeenCalledWith(
        ProvisionalDonationApprovedEvent.name,
      );
    });
  });

  describe('handleProvisionalDonationPartiallyMatched', () => {
    it('should transition provisional donation to Rejected state', async () => {
      // Create a provisional donation
      const provDon = ProvisionalDonation.create(
        g2gException,
        'test-sig',
        mockUser,
        1000,
        mockFunding,
      );

      // Mock repository findOne
      jest.spyOn(provDonRepo, 'findOne').mockResolvedValue(provDon);

      // Mock repository save
      jest.spyOn(provDonRepo, 'save').mockResolvedValue(provDon);

      // Mock event emitter
      const emitSpy = jest.spyOn(handler['eventEmitter'], 'emit');

      // Create and handle the event
      const event = new DepositPartiallyMatchedEvent({} as Deposit, provDon);
      await handler.handleDepositPartiallyMatched(event);

      // Verify the state transition
      expect(provDon.status).toBe(ProvisionalDonationStatus.Rejected);
      expect(provDonRepo.save).toHaveBeenCalledWith(provDon);

      // Verify event was emitted
      expect(emitSpy).toHaveBeenCalledWith(
        ProvisionalDonationPartiallyMatchedEvent.name,
      );
    });
  });
});
