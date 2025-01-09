import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CsCommentDto } from './dto/cs-comment.dto';
import { User } from 'src/entities/user.entity';
import { ValidCheck } from 'src/util/valid-check';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { InjectRepository } from '@nestjs/typeorm';
import { CsComment } from 'src/entities/cs-comment.entity';
import { CsBoardService } from '../cs-board/cs-board.service';

@Injectable()
export class CsCommentService {

  constructor(
    private readonly csBoardService: CsBoardService,

    @InjectRepository(CsComment)
    private readonly csComRepository: Repository<CsComment>,

    private readonly validCheck: ValidCheck,
    private readonly g2gException: GiftogetherExceptions

  ){}

  async create(csId: number, createCsBoard: CsCommentDto, user: User) {

    // 비밀글) 게시자와 댓글 작성자가 동일해야 한다. + 관리자 제외
    const csBoard = await this.csBoardService.findCsBoardByCsId(csId, user.userId);
    
    let csComment = new CsComment();
    csComment.csBoard = csBoard;
    csComment.csComCont = createCsBoard.csComCont;
    csComment.csComUser = user;

    console.log("create CsComment >>> ", csComment);

    const newComment = await this.csComRepository.save(csComment);
    console.log("Save new Comment >>> ", newComment);
    return newComment
  }

  async update(csComId: number, updateCsComment: CsCommentDto, userId: number) {

    const beforeCsComment = await this.csComRepository.findOne({
      where: { csComId },
      relations: ['csComUser']
    });
    console.log("find target csComment >>> ", beforeCsComment);
    await this.validCheck.verifyUserMatch(beforeCsComment.csComUser.userId, userId);

    if (!beforeCsComment) {
      throw this.g2gException.AccountNotFound;
    }

    Object.assign(beforeCsComment, updateCsComment);

    console.log("After update csBoard >>> ", beforeCsComment);

    return await this.csComRepository.save(beforeCsComment);
  }

  async delete(csComId: number) {

    const csComment = await this.csComRepository.findOne({
      where: { csComId },
    });
    return await this.csComRepository.delete({csComId});
    // console.log("find target csComment >>> ", csComment);
    // await this.validCheck.verifyUserMatch(csComment.csComUser.userId, userId);

    // if (!csComment) {
    //   throw this.g2gException.AccountNotFound;
    // }
    
    // csComment.isDel = true;
    // return await this.csComRepository.save(csComment);
  }
}
