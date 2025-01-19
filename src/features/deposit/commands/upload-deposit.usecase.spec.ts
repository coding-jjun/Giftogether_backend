import { UploadDepositUseCase } from './upload-deposit.usecase';
import { Deposit } from '../../../entities/deposit.entity';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { createDataSourceOptions } from 'src/tests/data-source-options';
import { DepositDto } from '../dto/deposit.dto';
import { Donation } from '../../../entities/donation.entity';
import { Funding } from '../../../entities/funding.entity';
import { User } from '../../../entities/user.entity';
import { CsBoard } from '../../../entities/cs-board.entity';
import { CsComment } from '../../../entities/cs-comment.entity';
import { Account } from '../../../entities/account.entity';
import { Comment } from '../../../entities/comment.entity';
import { Address } from '../../../entities/address.entity';
import { Image } from '../../../entities/image.entity';
import { Gift } from '../../../entities/gift.entity';
import { ProvisionalDonation } from '../../../entities/provisional-donation.entity';
import { Notification } from '../../../entities/notification.entity';
import { DataSource } from 'typeorm';

const entities = [
  Deposit,
  ProvisionalDonation,
  User,
  Account,
  Comment,
  Address,
  Image,
  Gift,
  Donation,
  Funding,
  Notification,
  CsBoard,
  CsComment,
];

describe('UploadDepositUseCase', () => {
  let depositRepository: Repository<Deposit>;
  let uploadDepositUseCase: UploadDepositUseCase;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(createDataSourceOptions(entities)),
        TypeOrmModule.forFeature([...entities]),
      ],
      providers: [UploadDepositUseCase],
    }).compile();

    depositRepository = module.get<Repository<Deposit>>(
      getRepositoryToken(Deposit),
    );
    uploadDepositUseCase = module.get(UploadDepositUseCase);
    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    dataSource.destroy();
  });

  it('should save a new deposit into the repository and return the created deposit entity', async () => {
    // Arrange
    const depositData = {
      senderSig: '홍길동-1234',
      receiver: 'Receiver Name',
      amount: 50000,
      transferDate: new Date('2023-12-01T10:00:00'),
      depositBank: 'Test Bank',
      depositAccount: '123-456-789',
      withdrawalAccount: '987-654-321',
    };

    // Act
    const createdDeposit = await uploadDepositUseCase.execute(
      new DepositDto(depositData),
    );
    // Assert
    const savedDeposits = await depositRepository.find({
      where: { depositId: createdDeposit.depositId },
    });

    // Verify that the deposit was saved in the repository
    expect(savedDeposits).toBeDefined();
    expect(savedDeposits.length).toBe(1);
    expect(savedDeposits[0].depositId).toEqual(createdDeposit.depositId);

    // Verify the returned entity
    expect(createdDeposit).toBeInstanceOf(Deposit);
    expect(createdDeposit.senderSig).toBe(depositData.senderSig);
    expect(createdDeposit.receiver).toBe(depositData.receiver);
    expect(createdDeposit.amount).toBe(depositData.amount);
    expect(createdDeposit.transferDate).toEqual(depositData.transferDate);
    expect(createdDeposit.depositBank).toBe(depositData.depositBank);
    expect(createdDeposit.depositAccount).toBe(depositData.depositAccount);
    expect(createdDeposit.withdrawalAccount).toBe(
      depositData.withdrawalAccount,
    );
  });

  it('should handle deposits with different data without overwriting existing ones', async () => {
    // Arrange
    const depositData1 = {
      senderSig: '홍길동-1234',
      receiver: 'Receiver Name 1',
      amount: 50000,
      transferDate: new Date('2023-12-01T10:00:00'),
      depositBank: 'Test Bank 1',
      depositAccount: '123-456-789',
      withdrawalAccount: '987-654-321',
    };
    const depositData2 = {
      senderSig: '김철수-5678',
      receiver: 'Receiver Name 2',
      amount: 100000,
      transferDate: new Date('2023-12-02T11:00:00'),
      depositBank: 'Test Bank 2',
      depositAccount: '123-456-790',
      withdrawalAccount: '987-654-322',
    };
    // Act
    const createdDeposit1 = await uploadDepositUseCase.execute(
      new DepositDto(depositData1),
    );
    const createdDeposit2 = await uploadDepositUseCase.execute(
      new DepositDto(depositData2),
    );
    // Assert
    expect(
      depositRepository.exists({
        where: { depositId: createdDeposit1.depositId },
      }),
    ).resolves.toBeTruthy();

    expect(
      depositRepository.exists({
        where: { depositId: createdDeposit2.depositId },
      }),
    ).resolves.toBeTruthy();

    // Verify the properties of the second deposit
    expect(createdDeposit2.senderSig).toBe(depositData2.senderSig);
    expect(createdDeposit2.receiver).toBe(depositData2.receiver);
    expect(createdDeposit2.amount).toBe(depositData2.amount);
    expect(createdDeposit2.transferDate).toEqual(depositData2.transferDate);
    expect(createdDeposit2.depositBank).toBe(depositData2.depositBank);
    expect(createdDeposit2.depositAccount).toBe(depositData2.depositAccount);
    expect(createdDeposit2.withdrawalAccount).toBe(
      depositData2.withdrawalAccount,
    );
  });
});
