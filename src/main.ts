import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const port = process.env.PORT;

  const debugOption = process.env.DEBUG === 'true';
  const nestFactoryOptions: Record<string, any> = {};

  if (!debugOption) {
    // DEBUG=false
    nestFactoryOptions.httpsOptions = {
      key: fs.readFileSync(process.env.SSL_KEY_LOCATION),
      cert: fs.readFileSync(process.env.SSL_CERTIFICATE_LOCATION),
    };
    nestFactoryOptions.logger = ['log', 'fatal', 'error', 'warn'];
  } else {
    // DEBUG=true
    nestFactoryOptions.logger = [
      'log',
      'fatal',
      'error',
      'warn',
      'debug',
      'verbose',
    ];
  }

  console.log(nestFactoryOptions);

  const app = await NestFactory.create(AppModule, nestFactoryOptions);

  const configService = app.get(ConfigService);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(cookieParser());
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = configService
        .get<string>('CORS_ORIGIN')
        .split(',');
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // 자격 증명이 포함된 요청을 허용
  });
  await app.listen(port);
}
bootstrap();
