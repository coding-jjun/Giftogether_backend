import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CsCommentDto } from './dto/cs-comment.dto';
import { User } from 'src/entities/user.entity';
import { ValidCheck } from 'src/util/valid-check';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { InjectRepository } from '@nestjs/typeorm';
import { CsComment } from 'src/entities/cs-comment.entity';
import { CsBoardService } from '../cs-board/cs-board.service';
import { CsBoard } from 'src/entities/cs-board.entity';
import { CsCommentReqeustDto } from './dto/cs-comment-request.dto';

function convertToCsCommentDto(csComment: CsComment): CsCommentDto {
  return new CsCommentDto(
    csComment.csComId,
    csComment.csComUser.userNick,
    csComment.csComCont,
    csComment.regAt,
    csComment.isMod
  )
}
@Injectable()
export class CsCommentService {

  constructor(
    private readonly csBoardService: CsBoardService,

    @InjectRepository(CsBoard)
    private readonly csRepository: Repository<CsBoard>,
    @InjectRepository(CsComment)
    private readonly csComRepository: Repository<CsComment>,

    private readonly validCheck: ValidCheck,
    private readonly g2gException: GiftogetherExceptions

  ){}

  async create(csId: number, createCsBoard: CsCommentReqeustDto, user: User) {
    
    console.log(user)
    const csBoard = await this.csRepository
      .createQueryBuilder('csBoard')
      .leftJoinAndSelect('csBoard.csUser', 'csUser')
      .where('csBoard.csId = :csId AND csBoard.isDel = false', {csId})
      .getOne();
    
    if (!csBoard) {
      console.log("Failed to find CsBoard")
      throw this.g2gException.CsBoardNotFound;
    }

    // 비밀글) 게시자와 댓글 작성자가 동일해야 한다. + 관리자 제외
    if (csBoard.isSecret && !user.isAdmin) {
      this.validCheck.verifyUserMatch(csBoard.csUser.userId, user.userId)
    }
    
    // 댓글 저장
    let csComment = new CsComment();
    csComment.csBoard = csBoard;
    csComment.csComCont = createCsBoard.csComCont;
    csComment.csComUser = user;
    const newComment = await this.csComRepository.save(csComment);
    console.log("create CsComment >>> ", newComment);

    // 게시글 정보 업데이트
    csBoard.lastComAt = newComment.regAt;
    csBoard.isUserWaiting = user.isAdmin ? false : true;
    await this.csRepository.save(csBoard)
    console.log("Update CsBoard >>> ", csId);
    return convertToCsCommentDto(newComment);
  }

  async update(csComId: number, updateCsComment: CsCommentReqeustDto, userId: number) {

    // 댓글 찾기
    const csComment = await this.csComRepository.findOne({
      where: { csComId, isDel: false },
      relations: ['csComUser']
    });
    if (!csComment) {
      throw this.g2gException.CsCommentNotFound;
    }
    console.log("find target csComment.csComId >>> ", csComment.csComId);

    // 댓글 작성자 유효성 검사
    await this.validCheck.verifyUserMatch(csComment.csComUser.userId, userId);
    
    // 댓글 수정
    csComment.csComCont = updateCsComment.csComCont;
    csComment.isMod = true;
    await this.csComRepository.save(csComment)
    console.log("After update csBoard.csComId >>> ", csComId);

    return convertToCsCommentDto(csComment);
  }

  async delete(csComId: number, userId: number) {

    const csComment = await this.csComRepository.findOne({
      where: { csComId },
      relations: ['csBoard', "csComUser"]
    });
    // console.log("find target csComment >>> ", csComment);
    // await this.validCheck.verifyUserMatch(csComment.csComUser.userId, userId);
    
    // if (!csComment) {
      //   throw this.g2gException.AccountNotFound;
      // }

      
      // 1. 삭제할 댓글 찾기 (게시글 정보 포함)

      const csBoard = csComment.csBoard;
      
      csComment.isDel = true;
      await this.csComRepository.save(csComment);

      const lastCsComment = await this.findLastCsComment(csBoard);
      await this.csBoardService.updateOnCsComment(csBoard, lastCsComment, false);
      
      return await this.csComRepository.delete({csComId});
  }

  async findLastCsComment(csBoard: CsBoard) {
    return await this.csComRepository.findOne({
      where: { csBoard: csBoard, isDel: false }, // 삭제되지 않은 최신 댓글 조회
      order: { regAt: "DESC" },
      relations: ["csComUser"],
    });
  }
}