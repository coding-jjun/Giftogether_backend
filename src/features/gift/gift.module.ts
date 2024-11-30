import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { GiftController } from './gift.controller';
import { GiftService } from './gift.service';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { Gift } from 'src/entities/gift.entity';
import { Funding } from 'src/entities/funding.entity';
import { Image } from 'src/entities/image.entity';
import { ImageModule } from '../image/image.module';
import { ImageService } from '../image/image.service';
import { User } from 'src/entities/user.entity';
import { ImageInstanceManager } from '../image/image-instance-manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gift, Funding, Image, User]),
    ImageModule,
  ],
  controllers: [GiftController],
  providers: [
    GiftService,
    GiftogetherExceptions,
    ImageService,
    ImageInstanceManager,
  ],
  exports: [GiftService],
})
export class GiftModule {}
