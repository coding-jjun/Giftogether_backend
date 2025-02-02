import { Global, Inject, Module, Provider } from '@nestjs/common';
import { TestAuthBase } from './test-auth-base';
import { TokenModule } from 'src/features/open-bank/token/token.module';
import { TokenService } from 'src/features/auth/token.service';
import { JwtService } from '@nestjs/jwt';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { EventHandlersModule } from 'src/event-handlers/event-handlers.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createDataSourceOptions } from './data-source-options';
import entities from 'src/entities/entities';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventModule } from 'src/features/event/event.module';
import { AuthModule } from 'src/features/auth/auth.module';
import { createClient } from '@redis/client';

/**
 * Testing Purpose Redis Client.
 * RedisModule은 무조건 .env 파일을 로드하지만 테스트 환경에서는 자율성을 보장하기 위한 선택.
 */
const customRedisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: async (configService: ConfigService) => {
    await ConfigModule.envVariablesLoaded;
    const client = createClient({
      socket: {
        host: configService.get('TEST_REDIS_HOST'),
        port: parseInt(configService.get('TEST_REDIS_PORT'), 10),
      },
      password: configService.get('TEST_REDIS_PASSWORD'),
    });
    await client.connect();
    return client;
  },
  inject: [ConfigService],
};

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot(createDataSourceOptions(entities)),
    TypeOrmModule.forFeature(entities),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    EventModule,
    TokenModule,
    AuthModule,
    EventHandlersModule,
  ],
  controllers: [],
  providers: [
    TestAuthBase,
    TokenService,
    JwtService,
    GiftogetherExceptions,
    customRedisProvider,
  ],
  exports: [TestAuthBase, customRedisProvider.provide],
})
export class TestsModule {}
