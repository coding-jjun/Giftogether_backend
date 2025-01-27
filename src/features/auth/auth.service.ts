import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { AuthType } from 'src/enums/auth-type.enum';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { ImageType } from 'src/enums/image-type.enum';
import { UserDto } from '../user/dto/user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { DefaultImageIds } from 'src/enums/default-image-id';
import { Nickname } from 'src/util/nickname';
import { GuestLoginDto } from './dto/guest-login.dto';
import { DonationService } from '../donation/donation.service';
import { ImageService } from '../image/image.service';
import { ImageInstanceManager } from '../image/image-instance-manager';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  private readonly NICKNAME_ARRAY_LENGTH: number = 119;
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly g2gException: GiftogetherExceptions,
    private readonly nickName: Nickname,

    private readonly donationService: DonationService,

    private readonly imgService: ImageService,

    private readonly imageManager: ImageInstanceManager,

    private readonly tokenService: TokenService,
  ) {}

  async parseDate(yearString: string, birthday: string): Promise<Date> {
    const parts = [birthday.slice(0, 2), birthday.slice(2, 4)];
    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    const year = parseInt(yearString);

    return new Date(year, month, day);
  }

  async isValidPassword(plainPw: string, hashPw: string): Promise<Boolean> {
    const isValidPw = await bcrypt.compare(plainPw, hashPw);
    if (!isValidPw) {
      throw this.g2gException.PasswordIncorrect;
    }
    return true;
  }

  async login(loginDto: LoginDto): Promise<UserDto> {
    //TODO 패스워드 db 비교
    const user = await this.userRepository.findOne({
      where: { userEmail: loginDto.userEmail },
    });
    if (!user) {
      throw this.g2gException.UserNotFound;
    }

    await this.isValidPassword(loginDto.userPw, user.userPw);

    const imgUrl = await this.imageManager
      .getImages(user)
      .then((imgs) => imgs[0].imgUrl);

    return new UserDto(
      user.userNick,
      user.userName,
      user.userPhone,
      user.userBirth,
      user.authType,
      imgUrl,
      user.userId,
      user.isAdmin,
      user.userEmail,
      user.authId,
    );
  }

  async createUser(userDto: CreateUserDto) {
    const { userImg, userPw, defaultImgId, ...userInfo } = userDto;
    const user = new User();

    Object.assign(user, userInfo);
    const userSaved = await this.userRepository.save(user);
    const userId = user.userId;
    // Password
    if (userPw) {
      const hashPw = await bcrypt.hash(userPw, 10);
      user.userPw = hashPw;
    }

    try {
      // Image
      let imgUrl = null;
      if (userImg) {
        // 사용자 정의 이미지 제공시,
        // 1. userId를 subid로 갖는 새 image 생성 및 저장
        // 2. user의 defaultImgId 컬럼을 null로 초기화
        const imgSaved = await this.imgService.save(
          userImg,
          user,
          ImageType.User,
          userId,
        );

        imgUrl = imgSaved.imgUrl;
        user.defaultImgId = null;
      } else {
        // 기본 이미지 제공시,
        // 1. 기본 이미지 가져오기
        // 2. user의 defaultImgId를 새 이미지의 id로 설정
        if (!defaultImgId || !DefaultImageIds.User.includes(defaultImgId))
          throw this.g2gException.DefaultImgIdNotExist;

        const defaultImage = await this.imgService.getInstanceByPK(
          userDto.defaultImgId,
        );
        user.defaultImgId = defaultImage.imgId;

        imgUrl = defaultImage.imgUrl;
      }
      await this.userRepository.update({ userId }, user);

      return new UserDto(
        userSaved.userNick,
        userSaved.userName,
        userSaved.userPhone,
        userSaved.userBirth,
        userSaved.authType,
        imgUrl,
        userSaved.userId,
        user.isAdmin,
        userSaved.userEmail,
        userSaved.authId,
      );
    } catch (error) {
      await this.userRepository.remove(user);
      throw error;
    }
  }

  async updateUser(user: User, userDto: UpdateUserDto): Promise<UserDto> {
    // TODO 사용자 정보를 repo에서 조회 후 updateUser 하도록 refactoring 예정
    const { userImg, ...userInfo } = userDto;
    const userId = user.userId;
    const defaultImgId = userDto.defaultImgId;

    Object.assign(user, userInfo);

    // 0. image 테이블에 등록된 사용자 프로필 이미지 삭제
    await this.imgService.delete(ImageType.User, userId);

    let imgUrl = null;
    if (userImg) {
      // 사용자 정의 이미지 제공시,
      // 1. userId를 subid로 갖는 새 image 생성 및 저장
      // 2. user의 defaultImgId 컬럼을 null로 초기화

      const imgSaved = await this.imgService.save(
        userImg,
        user,
        ImageType.User,
        userId,
      );

      imgUrl = imgSaved.imgUrl;
      user.defaultImgId = null;
    } else {
      // 기본 이미지 제공시,
      // 1. 기본 이미지 가져오기
      // 2. user의 defaultImgId를 새 이미지의 id로 설정

      if (!defaultImgId || !DefaultImageIds.User.includes(defaultImgId))
        throw this.g2gException.DefaultImgIdNotExist;

      const defaultImage = await this.imgService.getInstanceByPK(defaultImgId);
      user.defaultImgId = defaultImage.imgId;

      imgUrl = defaultImage.imgUrl;
    }
    await this.userRepository.update({ userId }, user);

    return new UserDto(
      user.userNick,
      user.userName,
      user.userPhone,
      user.userBirth,
      user.authType,
      imgUrl,
      user.userId,
      user.isAdmin,
      user.userEmail,
      user.authId,
    );
  }

  /**
   *
   * 회원가입시 이전 가입이력 확인을 위해 userEmail 검증
   */
  async validateUser(userEmail: string, authType: AuthType) {
    const user = await this.userRepository.findOne({
      where: { userEmail: userEmail },
    });

    if (!user) {
      return null;
    }

    if (user.authType !== authType && userEmail === user.userEmail) {
      throw this.g2gException.UserAlreadyExists;
    }

    const image = await this.imageManager
      .getImages(user)
      .then((images) => images[0]);

    return new UserDto(
      user.userNick,
      user.userName,
      user.userPhone,
      user.userBirth,
      user.authType,
      image.imgUrl,
      user.userId,
      user.isAdmin,
      user.userEmail,
      user.authId,
    );
  }

  // DB 에서 회원 propertyName(컬럼) 중 이미 사용중인 값인지 확인 (가입전 닉네임, 전화번호...)
  async validUserInfo(propertyName: string, propertyValue: string) {
    // 동적으로 조건 생성
    const condition = {};
    condition[propertyName] = propertyValue;
    const user = await this.userRepository.findOne({
      where: condition,
    });

    if (user) {
      return false;
    }
    return true;
  }

  async logout(refreshToken: string) {
    const tokenInfo = await this.tokenService.verifyRefreshToken(refreshToken);
    const userId = tokenInfo.sub;

    await this.tokenService.chkValidRefreshToken(refreshToken);
    await this.tokenService.setRefreshTokenToBlackList(userId, refreshToken);
  }

  async createRandomNickname(): Promise<string> {
    const adjectiveIndex = Math.floor(
      Math.random() * this.NICKNAME_ARRAY_LENGTH,
    );
    const nounIndex = Math.floor(Math.random() * this.NICKNAME_ARRAY_LENGTH);

    const adjective = this.nickName.adjective[adjectiveIndex];
    const noun = this.nickName.noun[nounIndex];
    const baseNick = `${adjective}${noun}`;

    // userNick이 baseNick으로 시작하는 모든 사용자 조회
    const duplicateNicknames = await this.userRepository.count({
      where: { userNick: Like(`${baseNick}%`) },
    });
    if (duplicateNicknames > 0) {
      return adjective + noun + (duplicateNicknames + 1);
    }

    return adjective + noun;
  }

  async loginGuest(guestLoginDto: GuestLoginDto) {
    const guest = await this.donationService.getGuestInfoByOrderId(
      guestLoginDto.orderId,
    );
    await this.isValidPassword(guestLoginDto.userPw, guest.userPw);

    return guest;
  }
}
