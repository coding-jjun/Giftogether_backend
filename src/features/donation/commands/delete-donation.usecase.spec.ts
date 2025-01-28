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
  createMockDeposit,
  createMockDonation,
  createMockFunding,
  createMockUser,
} from '../../../tests/mock-factory';
import { DonationStatus } from '../../../enums/donation-status.enum';
import { User } from '../../../entities/user.entity';
import { InvalidStatus } from '../../../exceptions/invalid-status';
import { Deposit } from 'src/entities/deposit.entity';
import { DecreaseFundSumUseCase } from 'src/features/funding/commands/decrease-fundsum.usecase';
import { createMockRepository } from 'src/tests/create-mock-repository';

describe('DeleteDonationUseCase', () => {
  let useCase: DeleteDonationUseCase;
  let donationRepo: Repository<Donation>;
  let donationFsmService: DonationFsmService;
  let eventEmitter: EventEmitter2;
  let g2gException: GiftogetherExceptions;

  let mockDonation: Donation;
  let mockFunding: Funding;
  let mockAdmin: User;
  let mockDeposit: Deposit;

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
        {
          provide: getRepositoryToken(Funding),
          useValue: createMockRepository(Repository<Funding>),
        },
        GiftogetherExceptions,
        DecreaseFundSumUseCase,
      ],
    }).compile();

    useCase = module.get<DeleteDonationUseCase>(DeleteDonationUseCase);
    donationRepo = module.get<Repository<Donation>>(
      getRepositoryToken(Donation),
    );
    donationFsmService = module.get<DonationFsmService>(DonationFsmService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    g2gException = module.get<GiftogetherExceptions>(GiftogetherExceptions);
    mockDeposit = createMockDeposit({ depositId: 1 });

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
      await useCase.execute(
        mockDonation.donId,
        mockAdmin.userId,
        mockDeposit.depositId,
      );

      // Assert
      expect(donationRepo.findOne).toHaveBeenCalledTimes(1);
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
      await expect(
        useCase.execute(donId, adminId, mockDeposit.depositId),
      ).rejects.toThrow(g2gException.DonationNotExists);
    });
  });
});
