import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from 'src/entities/donation.entity';
import { RollingPaper } from 'src/entities/rolling-paper.entity';
import { CreateDonationDto } from './dto/create-donation.dto';
import { CreateGuestDto } from './dto/create-guest.dto';
import { Funding } from 'src/entities/funding.entity';
import { User } from 'src/entities/user.entity';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { Image } from 'src/entities/image.entity';
import { ImageType } from 'src/enums/image-type.enum';
import { MyDonationListDto } from './dto/my-donation-list.dto';
import { DonationListDto } from './dto/other-donation-list.dto';
import { ValidCheck } from 'src/util/valid-check';
import { DefaultImageId } from 'src/enums/default-image-id';
import * as bcrypt from 'bcrypt';
import { ProvisionalDonation } from '../../entities/provisional-donation.entity';
import { CreateProvisionalDonationUseCase } from './commands/create-provisional-donation.usecase';
import { CreateProvisionalDonationCommand } from './commands/create-provisional-donation.command';
import { ProvisionalDonationDto } from './dto/provisional-donation.dto';

@Injectable()
export class DonationService {
  constructor(
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,

    @InjectRepository(RollingPaper)
    private readonly rollingPaperRepo: Repository<RollingPaper>,

    @InjectRepository(Funding)
    private readonly fundingRepo: Repository<Funding>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly g2gException: GiftogetherExceptions,

    private readonly validCheck: ValidCheck,

    private readonly createProvisionalDonation: CreateProvisionalDonationUseCase,
  ) {}

  async getAllDonations(userId: number): Promise<Donation[]> {
    // TODO: donation paging 처리
    const result = await this.donationRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.funding', 'f')
      .leftJoinAndSelect('d.user', 'u')
      .select(['d.donId', 'd.orderId', 'd.donAmnt', 'd.regAt', 'f.fundId'])
      .where('u.userId = :userId', { userId })
      .getMany();
    return result;
  }

  /**
   * 비회원 로그인시 orderId 로 사용자 정보 조회
   * @param orderId
   * @returns
   */
  async getGuestInfoByOrderId(orderId: string) {
    const donation = await this.donationRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.user', 'u')
      .where('d.orderId = :orderId', { orderId })
      .getOne();

    return donation.user;
  }

  async getDonationByUserId(userId: number) {
    const donation = await this.donationRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.funding', 'f')
      .leftJoinAndSelect('d.user', 'u')
      .select(['d.orderId', 'd.donAmnt', 'd.regAt', 'f.fundUuid'])
      .where('u.userId = :userId', { userId })
      .getOne();
    return donation;
  }

  async updateFundingSum(funding: Funding, donAmnt: number) {
    funding.fundSum += donAmnt;
    // TODO 펀딩 목표금액 달성 확인 후 Notification
    await this.fundingRepo.update(
      { fundId: funding.fundId },
      { fundSum: funding.fundSum },
    );

    return funding;
  }

  async validFundingDate(fundUuid: string) {
    const funding = await this.fundingRepo.findOne({ where: { fundUuid } });
    if (!funding) {
      throw this.g2gException.FundingNotExists;
    }
    if (funding.isClosed()) {
      throw this.g2gException.FundingClosed;
    }
    return funding;
  }

  async createUserDonation(
    fundUuid: string,
    createDonationDto: CreateDonationDto,
    user: User,
  ): Promise<ProvisionalDonationDto> {
    const funding = await this.validFundingDate(fundUuid);
    const provDon = await this.createDonation(funding, createDonationDto, user);
    return new ProvisionalDonationDto(
      provDon.provDonId,
      provDon.senderSig,
      provDon.senderUser.userId,
      provDon.amount,
      funding.fundUuid,
      provDon.status,
      provDon.regAt,
    );
  }

  async createGuest(guest: CreateGuestDto): Promise<User> {
    if (!guest || typeof guest === 'string') {
      throw this.g2gException.UserFailedToCreate;
    }
    const { userNick, userPhone, accBank, accNum } = guest;
    const user = new User();
    // TODO 주소관련 정보
    // const address = new Address();
    user.userNick = guest.userNick;
    user.userPhone = guest.userPhone;
    user.userPw = await bcrypt.hash(guest.userPw, 10);
    user.defaultImgId = DefaultImageId.User;
    // user.accId = 1;
    return await this.userRepo.save(user);
  }

  async createGuestDonation(
    fundUuid: string,
    createDonationDto: CreateDonationDto,
  ) {
    // TODO Donation 생성 실패시 user 객체 롤백 작업 필요
    // TODO createGuest 로직 createUser 메소드 재사용
    const funding = await this.validFundingDate(fundUuid);
    const user = await this.createGuest(createDonationDto.guest);
    return await this.createDonation(funding, createDonationDto, user);
  }

  /**
   * 사용자는 새 Donation을 바로 만들 수 없습니다. 예비후원이라는 의미의 ProvisionalDonation (줄여서 ProvDon)을
   * 만들어 시스템에 제출하고 안내받은 계좌번호를 통해 입금을 해야합니다.
   */
  async createDonation(
    funding: Funding,
    dto: CreateDonationDto,
    user: User,
  ): Promise<ProvisionalDonation> {
    return this.createProvisionalDonation.execute(
      new CreateProvisionalDonationCommand(
        dto.senderSig,
        user.userId,
        dto.donAmnt,
        funding.fundId,
      ),
    );
  }

  async findMineAll(
    userId: number,
    status: string,
    lastId?: number,
  ): Promise<{ donations: MyDonationListDto[]; lastId: number }> {
    const currentDate = new Date();
    let query = this.donationRepo
      .createQueryBuilder('donation')
      .leftJoinAndSelect('donation.funding', 'funding')
      .leftJoinAndSelect('donation.user', 'user')
      .leftJoinAndSelect('funding.fundUser', 'fundUser')
      .leftJoinAndMapOne(
        'fundUser.image',
        Image,
        'image',
        'fundUser.defaultImgId = image.imgId OR (fundUser.defaultImgId IS NULL AND image.subId = fundUser.userId AND image.imgType = :userType)',
        { userType: ImageType.User },
      )
      .leftJoinAndMapMany(
        'funding.images',
        Image,
        'fundImages',
        'funding.defaultImgId = fundImages.imgId OR (funding.defaultImgId IS NULL AND fundImages.subId = funding.fundId AND fundImages.imgType = :fundType)',
        { fundType: ImageType.Funding },
      )
      .where('donation.userId = :userId', { userId })
      .setParameter('currentDate', currentDate)
      .orderBy('donation.donId', 'DESC');

    if (status === 'ongoing') {
      query.andWhere('funding.endAt >= :currentDate');
    } else if (status === 'ended') {
      query.andWhere('funding.endAt < :currentDate');
    }

    if (lastId) {
      query.andWhere('donation.donId < :lastId', { lastId });
    }
    query.take(10);

    const donations = (await query.getMany()).map(
      (donation) => new MyDonationListDto(donation),
    );
    return {
      donations: donations,
      lastId: donations[donations.length - 1]?.donId,
    };
  }

  async findAll(
    funding: Funding,
    lastId?: number,
  ): Promise<{ donations: DonationListDto[]; lastId: number }> {
    const query = this.donationRepo
      .createQueryBuilder('donation')
      .orderBy('donation.donId', 'DESC')
      .where('donation.funding = :fundId', { fundId: funding.fundId })
      .leftJoinAndSelect('donation.user', 'user')
      .leftJoinAndMapOne(
        'user.image',
        Image,
        'image',
        '(user.defaultImgId = image.imgId OR (user.defaultImgId IS NULL AND image.subId = user.userId AND image.imgType = :userType))',
        { userType: ImageType.User },
      );

    if (lastId) {
      query.andWhere('donation.donId < :lastId', { lastId });
    }
    query.take(10);

    const donations = (await query.getMany()).map(
      (donation) => new DonationListDto(donation),
    );

    return {
      donations: donations,
      lastId: donations[donations.length - 1]?.donId,
    };
  }

  // Guest Delete
  async deleteGuestDonation(orderId: string): Promise<Boolean> {
    const donation = await this.donationRepo.findOne({
      where: { orderId },
    });
    if (donation) {
      console.log(donation);
      await this.donationRepo.softDelete(donation.donId);
      await this.rollingPaperRepo.softDelete({ rollId: donation.donId });
      return true;
    } else {
      return false;
    }
  }

  // DELETE
  async deleteDonation(userId: number, donId: number): Promise<Boolean> {
    const donation = await this.donationRepo.findOne({
      relations: {
        user: true,
      },
      where: { donId },
    });
    if (donation) {
      console.log(donation);

      // userId 유효성 검사
      await this.validCheck.verifyUserMatch(donation.user.userId, userId);
      await this.donationRepo.softDelete(donId);
      await this.rollingPaperRepo.softDelete({ rollId: donId });
      return true;
    } else {
      return false;
    }
  }

  /**
   * 한 유저가 여러번 후원하는 경우 예비후원과 이체내역을 찾을 수 없는 문제 때문에
   * '보내는 분'에 고유식별번호를 추가하기로 했습니다.
   *
   * [노션 문서](https://www.notion.so/c3cd436359344df6b60bfaed9bdbf784?pvs=4) 참고
   * @param username 입금자명
   */
  static createSenderSig(username: string) {
    const signature: string = Math.round(Math.random() * 100).toString();
    const delimeter = '-';
    return username + delimeter + signature;
  }
}
