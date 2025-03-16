import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CsCommentDto } from './dto/cs-comment.dto';
import { User } from 'src/entities/user.entity';
import { ValidCheck } from 'src/util/valid-check';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { InjectRepository } from '@nestjs/typeorm';
import { CsComment } from 'src/entities/cs-comment.entity';
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
    @InjectRepository(CsBoard)
    private readonly csRepository: Repository<CsBoard>,
    @InjectRepository(CsComment)
    private readonly csComRepository: Repository<CsComment>,

    private readonly validCheck: ValidCheck,
    private readonly g2gException: GiftogetherExceptions

  ){}

  async create(csId: number, createCsBoard: CsCommentReqeustDto, user: User) {
    
    const csBoard = await this.csRepository
      .createQueryBuilder('csBoard')
      .leftJoinAndSelect('csBoard.csUser', 'csUser')
      .where('csBoard.csId = :csId', {csId})
      .andWhere('csBoard.isDel = false')
      .getOne();
    
    if (!csBoard) {
      console.log("Failed to find CsBoard")
      throw this.g2gException.CsBoardNotFound;
    }

    if (!user.isAdmin && csBoard.isComplete) {
      throw this.g2gException.CsBoardIsComplete;
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

  async delete(csComId: number, user: User) {

    // 댓글 찾기
    const deleteComment = await this.csComRepository.findOne({
      where: { csComId, isDel: false },
      relations: ['csComUser', 'csBoard']
    });
    if (!deleteComment) {
      throw this.g2gException.CsCommentNotFound;
    }

    // 댓글 삭제
    deleteComment.isDel = true;
    await this.csComRepository.save(deleteComment);

    const csBoard = deleteComment.csBoard
    const latestComment = await this.csComRepository
      .createQueryBuilder('csComment')
      .leftJoinAndSelect('csComment.csComUser', 'csComUser')
      .where('csComment.csBoard = :csId', { csId: csBoard.csId })
      .andWhere('csComment.isDel = false')
      .orderBy('csComment.regAt', 'DESC')
      .getOne();
    
    // 댓글 없는 게시글 (위 삭제한 댓글이 첫번째 댓글)
    if (!latestComment) {
      csBoard.isUserWaiting = true;
      csBoard.lastComAt = null;

    } else {
      const isLastestIsAdmin = latestComment.csComUser.isAdmin

      // 최신 댓글로 게시글 정보 업데이트
      csBoard.isUserWaiting = isLastestIsAdmin ? false : true;
      csBoard.lastComAt = latestComment.regAt;
    }
    await this.csRepository.save(csBoard);
    console.log("CsBoard update >> latestComment")

    return convertToCsCommentDto(deleteComment);
  }
}