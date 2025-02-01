import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationModule } from './features/notification/notification.module';
import { UserModule } from './features/user/user.module';
import { FriendModule } from './features/friend/friend.module';
import { FundingModule } from './features/funding/funding.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DonationModule } from './features/donation/donation.module';
import { RollingPaperModule } from './features/rolling-paper/rolling-paper.module';
import { readFileSync } from 'fs';
import { AddressModule } from './features/address/address.module';
import { CommentModule } from './features/comment/comment.module';
import { GratitudeModule } from './features/gratitude/gratitude.module';
import { TokenModule } from './features/open-bank/token/token.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MulterModule } from '@nestjs/platform-express';
import { ImageModule } from './features/image/image.module';
import { GiftModule } from './features/gift/gift.module';
import { ExceptionModule } from './filters/exception.module';
import { AuthModule } from './features/auth/auth.module';
import { RedisModule } from './features/auth/redis.module';
import { EventModule } from './features/event/event.module';
import { AccountModule } from './features/account/account.module';
import { ValidCheckModule } from './util/valid-check.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './transform/transform.interceptor';
import { GiftogetherMiddleware } from './interfaces/giftogether.middleware';
import { DepositModule } from './features/deposit/deposit.module';
import { CsBoardModule } from './features/cs-board/cs-board.module';
import { CsCommentModule } from './features/cs-comment/cs-comment.module';
import entities from './entities/entities';
import { EventHandlersModule } from './event-handlers/event-handlers.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      // cache: true,
      expandVariables: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 5432,
      password: process.env.DB_DEV_PASSWORD,
      username: process.env.DB_DEV_USERNAME,
      database: process.env.DB_DEV_DATABASE,
      synchronize: true,
      logging: process.env.DEBUG === 'true',
      entities,
      ssl: {
        ca: readFileSync('global-bundle.pem'),
      },
      extra: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
    }),
    UserModule,
    FundingModule,
    DonationModule,
    RollingPaperModule,
    FriendModule,
    NotificationModule,
    AddressModule,
    CommentModule,
    GratitudeModule,
    TokenModule,
    MulterModule,
    ImageModule,
    GiftModule,
    ExceptionModule,
    AuthModule,
    RedisModule,
    EventModule,
    AccountModule,
    ValidCheckModule,
    DepositModule,
    CsBoardModule,
    CsCommentModule,
    EventHandlersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(GiftogetherMiddleware).forRoutes('');
  }
}

export function getNow(): string {
  const event = new Date();
  event.setTime(event.getTime() - event.getTimezoneOffset() * 60 * 1000);
  return event.toISOString();
}
