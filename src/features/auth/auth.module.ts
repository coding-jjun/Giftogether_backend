import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from 'src/entities/user.entity';
import { KakaoStrategy } from './strategy/kakao-strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt-strategy';
import { NaverStrategy } from './strategy/naver-strategy';
import { GoogleStrategy } from './strategy/google-strategy';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { Image } from 'src/entities/image.entity';
import { Account } from 'src/entities/account.entity';
import { DonationService } from '../donation/donation.service';
import { Donation } from 'src/entities/donation.entity';
import { RollingPaper } from 'src/entities/rolling-paper.entity';
import { Funding } from 'src/entities/funding.entity';
import { RollingPaperService } from '../rolling-paper/rolling-paper.service';
import { ValidCheck } from 'src/util/valid-check';
import { Nickname } from 'src/util/nickname';
import { ImageService } from '../image/image.service';
import { ImageInstanceManager } from '../image/image-instance-manager';
import { TokenService } from './token.service';
import { CreateProvisionalDonationUseCase } from '../donation/commands/create-provisional-donation.usecase';
import { ProvisionalDonation } from '../deposit/domain/entities/provisional-donation.entity';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),

    TypeOrmModule.forFeature([
      User,
      Image,
      Account,
      Donation,
      RollingPaper,
      Funding,
      ProvisionalDonation,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    DonationService,
    RollingPaperService,
    KakaoStrategy,
    JwtStrategy,
    NaverStrategy,
    GoogleStrategy,
    GiftogetherExceptions,
    ValidCheck,
    Nickname,
    ImageService,
    ImageInstanceManager,
    TokenService,
    CreateProvisionalDonationUseCase,
  ],
  exports: [PassportModule, AuthService, TokenService],
})
export class AuthModule {}
