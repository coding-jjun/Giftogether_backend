import { Test, TestingModule } from '@nestjs/testing';
import { DepositEventHandler } from './deposit-event.handler';
import { DepositMatchedEvent } from './deposit-matched.event';
import { NotificationService } from 'src/features/notification/notification.service';
import { User } from 'src/entities/user.entity';
import { Funding } from 'src/entities/funding.entity';
import { Donation } from 'src/entities/donation.entity';
import { Notification } from 'src/entities/notification.entity';
import { Deposit } from '../entities/deposit.entity';
import { ProvisionalDonation } from '../entities/provisional-donation.entity';
import { ImageType } from 'src/enums/image-type.enum';
import { AuthType } from 'src/enums/auth-type.enum';
import { FundTheme } from 'src/enums/fund-theme.enum';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { Account } from 'src/entities/account.entity';
import { Comment } from 'src/entities/comment.entity';
import { Address } from 'src/entities/address.entity';
import { Image } from 'src/entities/image.entity';
import { Gift } from 'src/entities/gift.entity';
import { CreateDonationUseCase } from 'src/features/donation/commands/create-donation.usecase';
import { IncreaseFundSumUseCase } from 'src/features/funding/commands/increase-fundsum.usecase';
import { GetDonationsByFundingUseCase } from 'src/features/donation/queries/get-donations-by-funding.usecase';
import { createMockProvider } from '../../../../tests/create-mock-repository';

const entities = [
  User,
  Account,
  Comment,
  Address,
  Image,
  Funding,
  Gift,
  Donation,
  Notification,
];

/**
 * ## 전제조건
 *
 * 샘플 펀딩이 하나 만들어져있고 세 명의 유저가 각각
 * matched, partially matched, unmatched 한 상황을 만들었다.
 *
 * ## Assumes
 *
 * match-deposit.usecase.spec.ts가 전부 통과한다고 가정.
 */
describe('DepositEventHandler', () => {
  let handler: DepositEventHandler;
  let notificationService: NotificationService;
  let fundingOwner: User;
  let matchedDonor: User;
  let partiallyMatchedDonor: User;
  let unmatchedDonator: User;
  let mockFunding: Funding;
  let createDonation: CreateDonationUseCase;
  let increaseFundSum: IncreaseFundSumUseCase;
  let g2gException: GiftogetherExceptions;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepositEventHandler,
        NotificationService,
        GiftogetherExceptions,
        CreateDonationUseCase,
        IncreaseFundSumUseCase,
        GetDonationsByFundingUseCase,
        ...entities.map(createMockProvider),
      ],
    }).compile();

    handler = module.get(DepositEventHandler);
    notificationService = module.get(NotificationService);
    createDonation = module.get(CreateDonationUseCase);
    increaseFundSum = module.get(IncreaseFundSumUseCase);
    g2gException = module.get(GiftogetherExceptions);

    // TODO - call mock factory
    fundingOwner = {
      imgSubId: 1,
      imageType: ImageType.User,
      userId: 1,
      authId: 'mockUser',
      authType: AuthType.Jwt,
      userNick: 'mockUser',
      userPw: 'password',
      userName: '홍길동',
      userPhone: '010-1234-5678',
      userBirth: new Date('1997-09-26'),
      account: null,
      regAt: new Date(Date.now()),
      uptAt: new Date(Date.now()),
      delAt: null,
      fundings: [],
      comments: [],
      addresses: [],
      userEmail: 'mockuser@example.com',
      user: null,
      defaultImgId: undefined,
      createdImages: [],
      image: null,
      isAdmin: false,
    };

    // TODO - call mock factory
    mockFunding = {
      fundUser: fundingOwner,
      fundTitle: 'mockFunding',
      fundCont: 'mockFunding',
      fundGoal: 1000000,
      endAt: new Date('9999-12-31'),
      fundTheme: FundTheme.Birthday,
      imgSubId: 0,
      imageType: ImageType.Funding,
      fundId: 0,
      fundUuid: 'mockFunding',
      fundPubl: false,
      fundSum: 0,
      fundAddrRoad: '',
      fundAddrDetl: '',
      fundAddrZip: '',
      fundRecvName: '',
      fundRecvPhone: '',
      fundRecvReq: '',
      regAt: new Date(Date.now()),
      uptAt: new Date(Date.now()),
      comments: [],
      gifts: [],
      donations: [],
      image: undefined,
    };

    matchedDonor = Object.create(fundingOwner);
    matchedDonor.userName = '일치하는 금액을 넣은 착한 후원자';

    partiallyMatchedDonor = Object.create(fundingOwner);
    partiallyMatchedDonor.userName = '실수로 0 하나를 더 써넣은 천사 후원자';

    unmatchedDonator = Object.create(fundingOwner);
    unmatchedDonator.userName =
      '실수로 보내는 분에 실명을 적어넣은 순진한 후원자';
  });

  it('should handle deposit.matched event', async () => {
    const deposit = Deposit.create(
      'sender',
      'receiver',
      1000,
      new Date(),
      'depositBank',
      'depositAccount',
      'withdrawalAccount',
    );

    const provisionalDonation = ProvisionalDonation.create(
      g2gException,
      matchedDonor.userName + '-1234',
      matchedDonor,
      1000,
      mockFunding,
    );
    const event = new DepositMatchedEvent(deposit, provisionalDonation);

    const donationSpy = jest.spyOn(createDonation, 'execute');
    const fundingSpy = jest.spyOn(increaseFundSum, 'execute');
    const notiSpy = jest.spyOn(notificationService, 'createNoti');

    await handler.handleDepositMatched(event);

    // Verify donation creation
    expect(donationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        funding: mockFunding,
        amount: deposit.amount,
        donor: matchedDonor,
      }),
    );

    expect(donationSpy).toHaveBeenCalledTimes(1);

    // Verify funding update
    expect(fundingSpy).toHaveBeenCalledWith(
      expect.objectContaining({ funding: mockFunding, amount: deposit.amount }),
    );

    // Verify notifications
    expect(notiSpy).toHaveBeenCalledTimes(2);

    // 후원자에게 알림이 정상적으로 보내졌습니다
    expect(notiSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        recvId: matchedDonor.userId,
        notiType: 'DonationSuccess',
        subId: mockFunding.fundUuid,
      }),
    );

    // 펀딩 주인에게 알림이 정상적으로 보내졌습니다
    expect(notiSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        recvId: fundingOwner.userId,
        sendId: matchedDonor.userId,
        notiType: 'NewDonate',
        subId: mockFunding.fundUuid,
      }),
    );
  });
});
