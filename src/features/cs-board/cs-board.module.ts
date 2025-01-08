import { Module } from '@nestjs/common';
import { CsBoardService } from './cs-board.service';
import { CsBoardController } from './cs-board.controller';
import { CsBoard } from 'src/entities/cs-board.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { ValidCheck } from 'src/util/valid-check';
import { CsComment } from 'src/entities/cs-comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CsBoard, CsComment, User]), AuthModule],
  providers: [CsBoardService, GiftogetherExceptions, ValidCheck],
  controllers: [CsBoardController]
})
export class CsBoardModule {}
