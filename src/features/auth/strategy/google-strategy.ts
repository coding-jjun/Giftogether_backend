import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-google-oauth20";
import { AuthService } from "../auth.service";
import { AuthType } from "src/enums/auth-type.enum";
import { CreateUserDto } from "../dto/create-user.dto";
import { TokenDto } from "../dto/token.dto";
import { UserRole } from "src/enums/user-role.enum";
import { GiftogetherExceptions } from "src/filters/giftogether-exception";
import { TokenService } from "../token.service";


@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google'){
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly g2gException: GiftogetherExceptions,
    private readonly tokenService: TokenService


  ){
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URI'),
      scope: ['profile', 'email']
      // scope += 'https://www.googleapis.com/auth/user.phonenumbers.read', 'https://www.googleapis.com/auth/user.birthday.read', 'https://www.googleapis.com/auth/user.addresses.read'
    });
  }
  async validate(
    access_token: string,
    refresh_token: string,
    profile: Profile,
    done: any,
  ) {

    const googleAccount = profile._json;
    if(!googleAccount.email_verified){
      // TODO 구글 이메일 에러
      done(null, false);
    }

    const createUserDto = new CreateUserDto();

    createUserDto.authType = AuthType.Google;
    createUserDto.authId = googleAccount.sub;
    createUserDto.userEmail = googleAccount.email;
    createUserDto.userName = googleAccount.name;

    // user == 로그인
    let user = null;
    let type = null;

    try {
      user = await this.authService.validateUser(googleAccount.email, AuthType.Google);
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
      const isValidNick = await this.authService.validUserInfo("userNick", googleAccount.given_name);
      if(isValidNick){
        createUserDto.userNick = googleAccount.given_name;
      }else {
        createUserDto.userNick = await this.authService.createRandomNickname();
      }

      if(googleAccount.picture){
        createUserDto.userImg = googleAccount.picture;
      }
      user = await this.authService.createUser(createUserDto);

      type = "signup"

    }else{
      type = "login"

    }
    const tokenDto = await this.tokenService.issueUserRoleBasedToken(user.userId, user.isAdmin);
    done(null, {user, tokenDto, type});
    
  }
}



