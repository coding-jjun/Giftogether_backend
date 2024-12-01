import {
  Controller,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  Post,
  Logger,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { KakaoAuthGuard } from './guard/kakao-auth-guard';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './guard/jwt-auth-guard';
import { NaverAuthGuard } from './guard/naver-auth-guard';
import { GoogleAuthGuard } from './guard/google-auth-guard';
import { CommonResponse } from 'src/interfaces/common-response.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from '../user/dto/user.dto';
import { LoginDto } from './dto/login.dto';
import { ValidDto } from './dto/valid.dto';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { TokenDto } from './dto/token.dto';
import { RefreshTokenDto } from './dto/refresh.token.dto';
import { UserType } from 'src/enums/user-type.enum';
import { GuestLoginDto } from './dto/guest-login.dto';
import { TokenService } from './token.service';
import { LoginResponseDto } from './dto/login-response.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly g2gException: GiftogetherExceptions,
    private readonly tokenService: TokenService
  ) {}

  private cookieOptions = {
    httpOnly: true,
    path: '/',
    secure: true,
    // sameSite: 'none' as 'none', // 크로스 도메인 요청을 허용하기 위해 none으로 설정
    domain: process.env.COOKIE_DOMAIN // 애플리케이션 도메인으로 설정
  };

  @Get('kakao')
  @UseGuards(KakaoAuthGuard)
  async kakaoLogin() {
    return;
  }

  @Get('kakao/callback')
  @UseGuards(KakaoAuthGuard)
  async kakaoCallback(@Req() req: Request, @Res() res: Response){
    const data = req.user as { user: UserDto, tokenDto: TokenDto, type: string, errCode: string };
    if(data.type === "fail"){
      return res.redirect(`${process.env.LOGIN_URL}?error=${data.errCode}`);
    }

    res.cookie('access_token', data.tokenDto.accessToken, this.cookieOptions);
    res.cookie('refresh_token', data.tokenDto.refreshToken, this.cookieOptions);
    res.cookie('user', JSON.stringify(data.user), this.cookieOptions);

    if( data.type === 'login'){
      return res.redirect(process.env.LOGIN_URL);
      
    }else{
      return res.redirect(process.env.SIGNUP_URL);
    }

  }

  @Get('naver')
  @UseGuards(NaverAuthGuard)
  async naverLogin() {
    return;
  }

  @Get('naver/callback')
  @UseGuards(NaverAuthGuard)
  async naverCallback(@Req() req: Request, @Res() res:Response){
    const data = req.user as { user: UserDto, tokenDto: TokenDto, type: string, errCode: string };
    if(data.type === "fail"){
      return res.redirect(`${process.env.LOGIN_URL}?error=${data.errCode}`);
    }
    res.cookie('access_token', data.tokenDto.accessToken, this.cookieOptions);
    res.cookie('refresh_token', data.tokenDto.refreshToken, this.cookieOptions);
    res.cookie('user', JSON.stringify(data.user), this.cookieOptions);

    if( data.type === 'login'){
      return res.redirect(process.env.LOGIN_URL);
      
    }else{
      return res.redirect(process.env.SIGNUP_URL);
    }
  }
  
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleLogin(){
    return;
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res:Response){
    const data = req.user as { user: UserDto, tokenDto: TokenDto, type: string, errCode: string };
    if(data.type === "fail"){
      return res.redirect(`${process.env.LOGIN_URL}?error=${data.errCode}`);
    }
    res.cookie('access_token', data.tokenDto.accessToken, this.cookieOptions);
    res.cookie('refresh_token', data.tokenDto.refreshToken, this.cookieOptions);
    res.cookie('user', JSON.stringify(data.user), this.cookieOptions);

    if( data.type === 'login'){
      return res.redirect(process.env.LOGIN_URL);
      
    }else{
      return res.redirect(process.env.SIGNUP_URL);
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response){
    const user = await this.authService.login(loginDto);
    const token = new TokenDto()
    token.accessToken = await this.tokenService.createAccessToken(UserType.USER,user.userId);
    token.refreshToken = await this.tokenService.createRefreshToken(user.userId);

    Logger.debug("accessToken: " + token.accessToken); // redirect로 변경되면서 디버그 환경에서 token을 확인하기 어려워졌습니다.
    Logger.debug("refreshToken: " + token.refreshToken); // redirect로 변경되면서 디버그 환경에서 token을 확인하기 어려워졌습니다.

    res.cookie("access_token", token.accessToken, this.cookieOptions);
    res.cookie("refresh_token", token.refreshToken, this.cookieOptions);
    res.cookie("user", user, this.cookieOptions);

    return {
      data: new LoginResponseDto(token.accessToken, token.refreshToken, user),
      message: "success"
    }
    // return res.redirect(process.env.LOGIN_URL);
  }

  @Post(`/signup`)
  async signup(
    @Body() createUserDto: CreateUserDto,
    @Res() res: Response
  ) {
    const user = await this.authService.createUser(createUserDto)
    const token = new TokenDto();
    token.accessToken = await this.tokenService.createAccessToken(UserType.USER, user.userId);
    token.refreshToken = await this.tokenService.createRefreshToken(user.userId);
    
    res.cookie("access_token", token.accessToken, this.cookieOptions);
    res.cookie("refresh_token", token.refreshToken, this.cookieOptions);
    res.cookie("user", user, this.cookieOptions);
    return res.json({ message: 'success' });
  }
  
  @Post('/token')
  async reIssueAccessToken(@Body() tokenDto: RefreshTokenDto, @Res() res: Response){
    const userId = await this.tokenService.chkValidRefreshToken(tokenDto.refreshToken);
    const accessToken = await this.tokenService.createAccessToken(UserType.USER, userId)
    res.cookie("access_token", accessToken, this.cookieOptions);
    return res.json({ message: 'success' }); 
  }
  
  @Post('/logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Body() tokenDto: RefreshTokenDto): Promise<CommonResponse>{
    await this.authService.logout(tokenDto.refreshToken);
    return {
      message: '로그아웃 성공',
      data: true
    }
  }

  @Post('/email')
  async validUserEmail(@Body() validDto: ValidDto): Promise<CommonResponse>{
    if(!validDto.userEmail){
      throw this.g2gException.NotValidEmail;
    }

    const isValid = await this.authService.validUserInfo("userEmail", validDto.userEmail);
    if(!isValid){
      throw this.g2gException.NotValidEmail;
    }
    return {
      message: '유효한 이메일 입니다.',
      data: true
    };
  }

  @Post('/phone')
  async validUserPhone(@Body() validDto: ValidDto): Promise<CommonResponse>{
    if(!validDto.userPhone){
      throw this.g2gException.NotValidPhone;
    }

    const isValid = await this.authService.validUserInfo("userPhone", validDto.userPhone);
    if(!isValid){
      throw this.g2gException.NotValidPhone;
    }
    return {
      message: '유효한 번호 입니다.',
      data: true
    }; 
  }

  @Post('/nickname/check')
  async validNickName(@Body() validDto: ValidDto): Promise<CommonResponse>{
    if(!validDto.userNick){
      throw this.g2gException.NotValidNick;
    }

    const isValid = await this.authService.validUserInfo("userNick", validDto.userNick);
    if(!isValid){
      throw this.g2gException.NotValidNick;
    }
    return {
      message: '유효한 닉네임 입니다.',
      data: true
    };
  }
  
  
  @Get('/nickname')
  async createRandomNickname(): Promise<CommonResponse> {
    const randomNickname = await this.authService.createRandomNickname();
    return {
      message: "랜덤 닉네임을 생성했습니다.",
      data: randomNickname
    };
    
  }


  @Post('/guest')
  async guestLogin(@Body() guestLoginDto: GuestLoginDto, @Res() res: Response) {
    const guest = await this.authService.loginGuest(guestLoginDto);
    const token = await this.tokenService.createAccessToken(UserType.GUEST, guest.userId);
    res.cookie("access_token", token);
    return res.json({ message: '비회원 로그인 성공' , user: guest});
  }


}
