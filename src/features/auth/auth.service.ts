import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { AuthType } from 'src/enums/auth-type.enum';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { RedisClientType } from '@redis/client';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
    private readonly jwtException: GiftogetherExceptions,
    @Inject('REDIS_CLIENT')
    private readonly redisClient: RedisClientType,

  ) {}

  async parseDate(yearString: string, birthday: string): Promise<Date> {
    const parts = [birthday.slice(0, 2), birthday.slice(2, 4)];
    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    const year = parseInt(yearString);

    return new Date(year, month, day);
  }

  async createAccessToken(userId: number): Promise<string> {
    return this.jwtService.sign(
      { userId, time: new Date()},
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '30m',
      }
    );
  }
  async createRefreshToken(userId: number): Promise<string> {
    const time = new Date();
    const token = this.jwtService.sign(
      { userId: userId, time: time },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }
    );
    await this.redisClient.set(`user:${userId}`, token, {
      EX: 60 * 60 * 24 * 7, // 7일 동안 유효
    });  
    return token;
  }

  /**
   * refresh token 디코딩 및 유효성 검사
   */
  async verifyRefreshToken(refreshToken: string){
    try{
      return await this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    }catch(error){
      throw this.jwtException.NotValidToken;
    }

  }

async validateRefresh(userId: string, refreshToken: string): Promise<boolean> {
  try {
    const storedToken = await this.redisClient.get(`user:${userId}`);
    console.log(userId, storedToken, refreshToken);
    if (refreshToken !== storedToken) {
      return false;
    }
    return true;

  } catch (error) {
    throw this.jwtException.RedisServerError;
  }
  }
  


  async filterNulls(obj: any) {
    const filtered = {};
    Object.keys(obj).forEach((key) => {
      if (obj[key] !== null) {
        filtered[key] = obj[key];
      }
    });
    return filtered;
  }

  /**
   * 
   * SNS 회원가입, 회원가입 중 추가정보을 저장할 때 사용
   */
  async saveAuthUser(userInfo: any, existUser?: User, imgUrl?: string) {
    const user = existUser || new User();
    if (imgUrl) {
      // TODO 이미지 객체 생성
    }
    // TODO 중복값에 대한 예외 처리 (userPhone, userNick)
    const filteredUserInfo = await this.filterNulls(userInfo);

    if(filteredUserInfo){

      Object.assign(user, filteredUserInfo);
      return await this.userRepository.save(user);
    }
    // TODO 예외처리
    return user;
  }

  /**
   * 
   * 회원가입시 이전 가입이력 확인을 위해 userEmail 검증 
   */
  async validateUser(userEmail: string, authType: AuthType) {
    const user = await this.userRepository.findOne({
      where: { userEmail: userEmail },
    });

    if(user.authType !== authType){
      throw this.jwtException.UserAlreadyExists
    }

    if (!user) {
      return null;
    }
    return user;

  }

  async validUserNick(userNick: string){
    const user = await this.userRepository.findOne({
      where: {userNick: userNick}
    });
    if(user){
      return false;
    }
    return true;
  }

  async verifyAccessToken(accessToken: string){
    try{
      return await this.jwtService.verify(accessToken, {
        secret: process.env.JWT_SECRET,
      });
    }catch(error){
      throw this.jwtException.NotValidToken;
    }

  }

  async isBlackListToken(userId: string, token: string): Promise<boolean> {
    try {
      const result = await this.redisClient.get(`black:${userId}:${token}`);
      return result !== null;
    } catch (error) {
      console.error('Redis server error:', error);
      throw this.jwtException.RedisServerError;
    }
  }
  async logout(userId: string, accessToken: string, refreshToken: string) {
    try {

      const accessKey = `black:${userId}:${accessToken}`;
      await this.redisClient.set(accessKey, ' ');
      await this.redisClient.expire(accessKey, 60 * 30);
  
      const refreshKey = `black:${userId}:${refreshToken}`;
      await this.redisClient.set(refreshKey, ' ');
      await this.redisClient.expire(refreshKey, 60 * 60 * 24 * 7);
  
      await this.redisClient.del(`user:${userId}`);

    } catch (error) {
      throw this.jwtException.FailedLogout;
    }
  }
  

}
