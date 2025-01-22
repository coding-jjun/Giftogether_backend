import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeleteDonationUseCase } from './delete-donation.usecase';
import { Donation } from '../../../entities/donation.entity';
import { GiftogetherExceptions } from '../../../filters/giftogether-exception';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DonationFsmService } from '../domain/services/donation-fsm.service';
import { DonationDeletedEvent } from '../domain/events/donation-deleted.event';
import { DonationDeleteFailedEvent } from '../domain/events/donation-delete-failed.event';
import { Funding } from '../../../entities/funding.entity';
import {
  createMockDonation,
  createMockFunding,
  createMockUser,
} from '../../../tests/mock-factory';
import { DonationStatus } from '../../../enums/donation-status.enum';
import { User } from '../../../entities/user.entity';
import { InvalidStatus } from '../../../exceptions/invalid-status';

describe('DeleteDonationUseCase', () => {
  let useCase: DeleteDonationUseCase;
  let donationRepo: Repository<Donation>;
  let donationFsmService: DonationFsmService;
  let eventEmitter: EventEmitter2;
  let g2gException: GiftogetherExceptions;

  let mockDonation: Donation;
  let mockFunding: Funding;
  let mockAdmin: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteDonationUseCase,
        DonationFsmService,
        EventEmitter2,
        {
          provide: getRepositoryToken(Donation),
          useValue: {
            findOne: jest.fn(),
            manager: {
              transaction: jest.fn((fn) =>
                fn({
                  save: jest.fn(),
                  softDelete: jest.fn(),
                }),
              ),
            },
          },
        },
        GiftogetherExceptions,
      ],
    }).compile();

    useCase = module.get<DeleteDonationUseCase>(DeleteDonationUseCase);
    donationRepo = module.get<Repository<Donation>>(
      getRepositoryToken(Donation),
    );
    donationFsmService = module.get<DonationFsmService>(DonationFsmService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    g2gException = module.get<GiftogetherExceptions>(GiftogetherExceptions);

    mockAdmin = createMockUser({
      userId: 999,
    });
    mockFunding = createMockFunding({
      fundId: 200,
    });

    mockDonation = createMockDonation({
      donId: 1,
      userId: 100,
      funding: mockFunding,
      donStat: DonationStatus.Donated,
      transition: jest.fn().mockImplementation(() => {
        return Donation.prototype.transition;
      }),
    });

    jest.spyOn(donationRepo, 'findOne').mockResolvedValue(mockDonation);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should successfully delete a donation', async () => {
      // Arrange
      jest.spyOn(donationRepo, 'findOne').mockResolvedValue(mockDonation);
      jest.spyOn(donationRepo.manager, 'transaction');
      jest.spyOn(eventEmitter, 'emit');

      // Act
      const result = await useCase.execute(
        mockDonation.donId,
        mockAdmin.userId,
      );

      // Assert
      expect(result).toBe(true);
      expect(donationRepo.findOne).toHaveBeenCalledWith({
        where: { donId: mockDonation.donId },
      });
      expect(mockDonation.transition).toHaveBeenCalledWith(
        DonationDeletedEvent.name,
        donationFsmService,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        DonationDeletedEvent.name,
        expect.any(DonationDeletedEvent),
      );
    });

    it('should throw an error when donation does not exist', async () => {
      // Arrange
      const donId = 999;
      const adminId = 999;
      jest.spyOn(donationRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(donId, adminId)).rejects.toThrow(
        g2gException.DonationNotExists,
      );
    });

    it('should handle transition failure and emit delete failed event', async () => {
      // Arrange
      jest.spyOn(donationRepo, 'findOne').mockResolvedValue({
        ...mockDonation,
        transition: jest.fn().mockImplementation(() => {
          throw new InvalidStatus(
            DonationStatus.Donated,
            DonationDeletedEvent.name,
          );
        }),
      });
      jest.spyOn(eventEmitter, 'emit');

      // Act
      const result = await useCase.execute(
        mockDonation.donId,
        mockAdmin.userId,
      );

      // Assert
      expect(result).toBe(false);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        DonationDeleteFailedEvent.name,
        expect.any(DonationDeleteFailedEvent),
      );
    });
  });
});
