import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { UserRole } from 'src/enums/user-role.enum';
import { TokenService } from '../token.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly g2gException: GiftogetherExceptions,
    private readonly tokenService: TokenService
  ) {
    super('jwt');
  }

  /**
   * 요청 보호, 검증 위임, 유효한 토큰에 대한 요청 처리(/차단)
   * @param context 
   * @returns 
   */

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const cookies = request.cookies;
    const accessToken = cookies['access_token'];

    if (!accessToken) {
      throw this.g2gException.TokenMissing;
    }
    
    try {
      const tokenInfo = await this.tokenService.verifyAccessToken(accessToken);

      // 비회원이 정회원 API 요청한 경우
      if(UserRole.GUEST === tokenInfo.role && request.url !== '/donation/guest') {
        throw this.g2gException.InvalidUserRole;

      }
      const isInBlackList = await this.tokenService.isBlackListToken(tokenInfo.sub, accessToken);
      if (isInBlackList) {
        throw this.g2gException.NotValidToken;
      }

      return super.canActivate(context) as Promise<boolean>;
    } catch (error) {
      throw this.g2gException.NotValidToken;
    }
  }
}
