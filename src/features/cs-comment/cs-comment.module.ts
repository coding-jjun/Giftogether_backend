import { Module } from '@nestjs/common';
import { CsCommentService } from './cs-comment.service';
import { CsCommentController } from './cs-comment.controller';
import { CsBoard } from 'src/entities/cs-board.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { ValidCheck } from 'src/util/valid-check';
import { CsComment } from 'src/entities/cs-comment.entity';
import { CsBoardService } from '../cs-board/cs-board.service';

@Module({
  imports: [TypeOrmModule.forFeature([CsBoard, CsComment, User]), AuthModule],
  providers: [CsBoardService, CsCommentService, GiftogetherExceptions, ValidCheck],
  controllers: [CsCommentController]
})
export class CsCommentModule {}
