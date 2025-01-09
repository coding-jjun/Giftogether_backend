import { Test, TestingModule } from '@nestjs/testing';
import { ProvisionalDonationEventHandler } from './provisional-donation-event-handler';
import { ProvisionalDonationFsmService } from '../services/provisional-donation-fsm.service';
import { ProvisionalDonation } from 'src/entities/provisional-donation.entity';
import { Repository } from 'typeorm';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProvisionalDonationApprovedEvent } from './provisional-donation-approved.event';
import { ProvisionalDonationPartiallyMatchedEvent } from './provisional-donation-partially-matched.event';
import { ProvisionalDonationStatus } from 'src/enums/provisional-donation-status.enum';
import { User } from 'src/entities/user.entity';
import { Funding } from 'src/entities/funding.entity';

describe('ProvisionalDonationEventHandler', () => {
  let handler: ProvisionalDonationEventHandler;
  let fsmService: ProvisionalDonationFsmService;
  let provDonRepo: Repository<ProvisionalDonation>;
  let g2gException: GiftogetherExceptions;
  let mockUser: User;
  let mockFunding: Funding;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvisionalDonationEventHandler,
        ProvisionalDonationFsmService,
        GiftogetherExceptions,
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

      // Create and handle the event
      const event = new ProvisionalDonationApprovedEvent('test-sig');
      await handler.handleProvisionalDonationApproved(event);

      // Verify the state transition
      expect(provDon.status).toBe(ProvisionalDonationStatus.Approved);
      expect(provDonRepo.save).toHaveBeenCalledWith(provDon);
    });

    it('should throw exception when provisional donation not found', async () => {
      // Mock repository to return null
      jest.spyOn(provDonRepo, 'findOne').mockResolvedValue(null);

      // Create and handle the event
      const event = new ProvisionalDonationApprovedEvent('non-existent-sig');

      // Verify that it throws the correct exception
      await expect(
        handler.handleProvisionalDonationApproved(event),
      ).rejects.toBe(g2gException.ProvisionalDonationNotFound);
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

      // Create and handle the event
      const event = new ProvisionalDonationPartiallyMatchedEvent('test-sig');
      await handler.handleProvisionalDonationPartiallyMatched(event);

      // Verify the state transition
      expect(provDon.status).toBe(ProvisionalDonationStatus.Rejected);
      expect(provDonRepo.save).toHaveBeenCalledWith(provDon);
    });

    it('should throw exception when provisional donation not found', async () => {
      // Mock repository to return null
      jest.spyOn(provDonRepo, 'findOne').mockResolvedValue(null);

      // Create and handle the event
      const event = new ProvisionalDonationPartiallyMatchedEvent(
        'non-existent-sig',
      );

      // Verify that it throws the correct exception
      await expect(
        handler.handleProvisionalDonationPartiallyMatched(event),
      ).rejects.toBe(g2gException.ProvisionalDonationNotFound);
    });
  });
});
