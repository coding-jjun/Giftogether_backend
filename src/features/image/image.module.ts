import { Module } from '@nestjs/common';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guard/jwt-auth-guard';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Image } from 'src/entities/image.entity';
import { S3Service } from './s3.service';
import { ImageInstanceManager } from './image-instance-manager';

@Module({
  imports: [TypeOrmModule.forFeature([Image]), AuthModule],
  controllers: [ImageController],
  providers: [
    ImageService,
    JwtAuthGuard,
    GiftogetherExceptions,
    S3Service,
    ImageInstanceManager,
  ],
  exports: [ImageService, S3Service, ImageInstanceManager],
})
export class ImageModule {}
