import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CsBoard } from 'src/entities/cs-board.entity';
import { CreateCsBoardDto } from './dto/create-cs-board.dto';
import { User } from 'src/entities/user.entity';
import { CsBoardDto } from './dto/cs-board.dto';
import { ValidCheck } from 'src/util/valid-check';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { UpdateCsBoardDto } from './dto/update-cs-board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CsType } from 'src/enums/cs-type.enum';
import { CsComment } from 'src/entities/cs-comment.entity';

@Injectable()
export class CsBoardService {
  constructor(
    @InjectRepository(CsBoard)
    private readonly csRepository: Repository<CsBoard>,
    private readonly validCheck: ValidCheck,
    private readonly g2gException: GiftogetherExceptions

  ){}

  async findCsBoardByCsId(csId: number, userId: number) {
    const csBoard = await this.csRepository.findOne({
      where: { csId },
      relations: ['csUser', 'csComments']
    });
    // 비밀글
    if(csBoard.isSecret){
      // 작성자 & 관리자가 아닐 경우
      if(csBoard.csUser.userId != userId && ! csBoard.csUser.isAdmin) {
        // throw this.g2gException.NoPermissionCsBoard;
      }
    }
    return csBoard;
  }

  // 
  async findOneCsBoard(csId: number, userId: number) {
    const csBoard = await this.findCsBoardByCsId(csId, userId);
    const responseBoard = new CsBoardDto();
    responseBoard.userNick = csBoard.csUser.userNick;
    return Object.assign(responseBoard, csBoard);
  }


  // TODO 카테고리 조회
  async findAllCsBoards(csType:CsType) {
    console.log(csType);
    return await this.csRepository
    .createQueryBuilder('csBoard')
    .leftJoinAndSelect('csBoard.csUser', 'csUser')
    .where('csBoard.csType = :csType', { csType })
    .andWhere('csBoard.isDel = :isDel', { isDel: false })
    .getMany();
    // console.log(">>>>> csBoard " , csBoards);
    // const result = csBoards.map(() => new CsBoardDto());

    // console.log("result >>>>> ", result)

    // return result;

  }

  async create(createCsBoard: CreateCsBoardDto, user: User) {

    const csBoard = new CsBoard(createCsBoard, user);
    console.log("create CsBoard >>> ", csBoard);

    // 게시자가 관리자일 경우 : 댓글 막기
    if(user.isAdmin){
     csBoard.isComplete = true; 
    }
    // 관리자 공지사항
    if(CsType.Announcement == createCsBoard.csType) {
      csBoard.isComplete = true;
      csBoard.isUserWaiting = false;
    }
    const newBoard = await this.csRepository.save(csBoard);
    console.log("Save new Board >>> ", newBoard);
    return newBoard
  }

  async update(csId: number, updateCsBoardDto: UpdateCsBoardDto, userId: number) {

    const beforeCsBoard = await this.csRepository.findOne({
      where: { csId },
      relations: ['csUser']
    });
    console.log("find target csBoard >>> ", beforeCsBoard);
    await this.validCheck.verifyUserMatch(beforeCsBoard.csUser.userId, userId);

    if (!beforeCsBoard) {
      throw this.g2gException.AccountNotFound;
    }

    Object.assign(beforeCsBoard, updateCsBoardDto);

    console.log("After update csBoard >>> ", beforeCsBoard);

    return await this.csRepository.save(beforeCsBoard);
  }

  async delete(csId: number) {
    const userId = 1;

    const csBoard = await this.csRepository.findOne({
      where: { csId },
      // relations: ['csUser']
    });
    // return await this.csRepository.delete(csBoard);
    return await this.csRepository.delete({
      csId: csId
    });
    // console.log("find target csBoard >>> ", csBoard);
    // await this.validCheck.verifyUserMatch(csBoard.csUser.userId, userId);

    // if (!csBoard) {
    //   throw this.g2gException.AccountNotFound;
    // }
    
    // csBoard.isDel = true;
    // return await this.csRepository.save(csBoard);
    // TODO 댓글 삭제 isDelete
    
  }


  /**
   * 댓글 생성/삭제에 따른 게시글 수정
   */
  async updateOnCsComment(csBoard: CsBoard, lastCsComment: CsComment, isNewComment: boolean) {

    let lastCommenterisAdmin = false; // 댓글이 없는 게시글
    if(lastCsComment != null) {       // 댓글 있는 게시글
      lastCommenterisAdmin = lastCsComment.csComUser.isAdmin;
    }
    if(isNewComment) {
      csBoard.lastComAt = lastCsComment.regAt; // 새로운 댓글 생성 날짜로 업데이트
    }
    csBoard.isUserWaiting = lastCommenterisAdmin ? false : true;
    await this.csRepository.save(csBoard);
  }
}