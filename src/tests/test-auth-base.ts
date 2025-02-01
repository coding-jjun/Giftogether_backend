import { Injectable, Scope } from '@nestjs/common';
import { TokenService } from 'src/features/auth/token.service';
import { User } from 'src/entities/user.entity';

/**
 * Provides a base class for testing that allows logging in with a mock user.
 * @see https://docs.nestjs.com/fundamentals/testing#testing-request-scoped-instances
 */
@Injectable({ scope: Scope.REQUEST })
export class TestAuthBase {
  private _cookies: string[] = [];

  static cookieOptions = {
    httpOnly: true,
    path: '/',
    secure: process.env.DEBUG === 'false',
    // sameSite: 'none' as 'none', // 크로스 도메인 요청을 허용하기 위해 none으로 설정
    domain: process.env.COOKIE_DOMAIN, // 애플리케이션 도메인으로 설정
  };

  constructor(private readonly tokenService: TokenService) {}

  /**
   * Logs in with the provided user and stores cookies for testing.
   * @param user Mock User to log in
   */
  async login(user: User): Promise<void> {
    const tokenDto = await this.tokenService.issueUserRoleBasedToken(
      user.userId,
      user.isAdmin,
    );

    // Store cookies in the correct format
    const c = TestAuthBase.cookieOptions;
    const httpOnly = c.httpOnly ? 'HttpOnly;' : '';
    this._cookies = [
      `access_token=${tokenDto.accessToken}; Path=${c.path}; Domain=${c.domain}; ${httpOnly}`,
      `refresh_token=${tokenDto.refreshToken}; Path=${c.path}; Domain=${c.domain}; ${httpOnly}`,
    ];
  }

  get cookies(): string[] {
    return this._cookies;
  }
}
