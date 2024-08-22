import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gratitude } from 'src/entities/gratitude.entity';
import { GratitudeController } from './gratitude.controller';
import { GratitudeService } from './gratitude.service';
import { Funding } from 'src/entities/funding.entity';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { Image } from 'src/entities/image.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guard/jwt-auth-guard';
import { AuthService } from '../auth/auth.service';
import { User } from 'src/entities/user.entity';
import { Account } from 'src/entities/account.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gratitude, Funding, Image, User, Account]),
    AuthModule,
  ],
  controllers: [GratitudeController],
  providers: [GratitudeService, GiftogetherExceptions, JwtService],
})
export class GratitudeModule {}
