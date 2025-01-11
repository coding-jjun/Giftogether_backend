import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProvisionalDonationUseCase } from './create-provisional-donation.usecase';
import { ProvisionalDonation } from 'src/entities/provisional-donation.entity';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { CreateProvisionalDonationCommand } from './create-provisional-donation.command';
import { User } from 'src/entities/user.entity';
import { Funding } from 'src/entities/funding.entity';
import { createMockRepository } from '../../../tests/create-mock-repository';

describe('CreateProvisionalDonationUseCase', () => {
  let useCase: CreateProvisionalDonationUseCase;
  let repository: Repository<ProvisionalDonation>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProvisionalDonationUseCase,
        {
          provide: getRepositoryToken(ProvisionalDonation),
          useValue: createMockRepository(Repository<ProvisionalDonation>),
        },
        {
          provide: GiftogetherExceptions,
          useValue: new GiftogetherExceptions(),
        },
      ],
    }).compile();

    useCase = module.get<CreateProvisionalDonationUseCase>(
      CreateProvisionalDonationUseCase,
    );
    repository = module.get<Repository<ProvisionalDonation>>(
      getRepositoryToken(ProvisionalDonation),
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create and save a provisional donation', async () => {
    const cmd = new CreateProvisionalDonationCommand(
      'test-sig',
      1,
      1000,
      1,
    );

    const provdon = {
      senderSig: 'test-sig',
      senderUser: { userId: 1 } as User,
      amount: 1000,
      funding: { fundUuid: 'test-uuid' } as Funding,
    } as ProvisionalDonation;
    jest.spyOn(ProvisionalDonation, 'create').mockReturnValue(provdon);
    jest.spyOn(repository, 'insert');

    const result = await useCase.execute(cmd);

    expect(ProvisionalDonation.create).toHaveBeenCalledWith(
      expect.any(GiftogetherExceptions),
      'test-sig',
      { userId: 1 } as User,
      1000,
      { fundId: 1 } as Funding,
    );
    expect(repository.insert).toHaveBeenCalledWith(provdon);
    expect(result).toBe(provdon);
  });

  it('should throw an exception if creation fails', async () => {
    const cmd = new CreateProvisionalDonationCommand(
      'test-sig',
      1,
      1000,
      1,
    );

    jest.spyOn(ProvisionalDonation, 'create').mockImplementation(() => {
      throw new Error('Creation failed');
    });

    await expect(useCase.execute(cmd)).rejects.toThrow('Creation failed');
  });
});
