import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-kakao';
import { AuthService } from '../auth.service';
import { AuthType } from 'src/enums/auth-type.enum';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { CreateUserDto } from '../dto/create-user.dto';
import { TokenDto } from '../dto/token.dto';
import { UserRole } from 'src/enums/user-role.enum';
import { TokenService } from '../token.service';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly g2gException: GiftogetherExceptions,
    private readonly tokenService: TokenService

  ) {
    super({
      clientID: configService.get<string>('KAKAO_CLIENT_ID'),
      clientSecret: configService.get<string>('KAKAO_CLIENT_SECRET'),
      callbackURL: configService.get<string>('KAKAO_CALLBACK_URI'),
    });
  }
  async validate(
    access_token: string,
    refresh_token: string,
    profile: Profile,
    done: any,
  ) {
    const resProfile = profile._json;
    const kakaoAccount = resProfile.kakao_account;

    const createUserDto = new CreateUserDto();

    createUserDto.authType = AuthType.Kakao;
    createUserDto.authId = resProfile.id;
    createUserDto.userEmail = kakaoAccount.email;
    createUserDto.userName = kakaoAccount.name;

    // user == 로그인
    let user = null;
    let type = null;

    try {
      user = await this.authService.validateUser(kakaoAccount.email, AuthType.Kakao);
    }
    // 이미 가입한 계정 (중복 가입)
    catch (error) {
      // console.log("error->",error.message);
      type = "fail"
      return done(null, { type: "fail", errCode: this.g2gException.UserAlreadyExists.getErrCode() });
      // done(null, {user, tokenDto, type});
    }

    // 관리자 접근 제한
    if(user.isAdmin) {
      return done(null, { type: "fail", errCode : this.g2gException.SnsLoginBlocked.getErrCode() })
    }
    

    // ! user == 회원 가입
    if(! user){
      // 닉네임 유효성 검증
      const isValidNick = await this.authService.validUserInfo("userNick", kakaoAccount.profile.nickname);
      if(isValidNick){
        createUserDto.userNick = kakaoAccount.profile.nickname;
      }else{
        createUserDto.userNick = await this.authService.createRandomNickname();
      }
    
      // 핸드폰 번호 유효성 검증
      if(kakaoAccount.phone_number){
        
        const isValidPhone = await this.authService.validUserInfo("userPhone", kakaoAccount.phone_number);
        if(! isValidPhone){
          throw this.g2gException.UserAlreadyExists;
        }
        createUserDto.userPhone = kakaoAccount.phone_number;
      }

      if (kakaoAccount.has_birthyear && kakaoAccount.has_birthday) {
        createUserDto.userBirth = await this.authService.parseDate(
          kakaoAccount.birthyear,
          kakaoAccount.birthday,
        );
      }
      createUserDto.userImg = kakaoAccount.profile.thumbnail_image_url;

      user = await this.authService.createUser(createUserDto);
      type = "signup"
    }else{
      type = "login"
    }
    const tokenDto = await this.tokenService.issueUserRoleBasedToken(user.userId, user.isAdmin);
    done(null, {user, tokenDto, type});
  }
}
