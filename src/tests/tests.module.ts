import { Module } from '@nestjs/common';
import { TestAuthBase } from './test-auth-base';
import { TokenModule } from 'src/features/open-bank/token/token.module';
import { TokenService } from 'src/features/auth/token.service';
import { JwtService } from '@nestjs/jwt';
import { RedisModule } from 'src/features/auth/redis.module';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { EventHandlersModule } from 'src/event-handlers/event-handlers.module';

@Module({
  imports: [TokenModule, RedisModule, EventHandlersModule],
  controllers: [],
  providers: [TestAuthBase, TokenService, JwtService, GiftogetherExceptions],
  exports: [TestAuthBase],
})
export class TestsModule {}
