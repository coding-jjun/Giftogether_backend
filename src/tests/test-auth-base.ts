import { Injectable } from '@nestjs/common';
import { AuthService } from 'src/features/auth/auth.service';
import { LoginDto } from 'src/features/auth/dto/login.dto';
import { TokenService } from 'src/features/auth/token.service';
import { TokenDto } from 'src/features/auth/dto/token.dto';

@Injectable()
export class TestAuthBase {
  private cookieOptions = {
    httpOnly: true,
    path: '/',
    secure: process.env.DEBUG === 'false',
    // sameSite: 'none' as 'none', // 크로스 도메인 요청을 허용하기 위해 none으로 설정
    domain: process.env.COOKIE_DOMAIN, // 애플리케이션 도메인으로 설정
  };

  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  async loginAndGetCookies(loginDto: LoginDto): Promise<TokenDto> {
    const user = await this.authService.login(loginDto);
    const tokenDto = await this.tokenService.issueUserRoleBasedToken(
      user.userId,
      user.isAdmin,
    );
    return tokenDto;
  }
}
