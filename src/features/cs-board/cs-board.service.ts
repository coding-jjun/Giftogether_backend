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
import { CsCommentDto } from '../cs-comment/dto/cs-comment.dto';


function convertToCsBoardDto(csBoard: CsBoard, csComments: CsCommentDto[]): CsBoardDto {
  
  return new CsBoardDto(
    csBoard.csId,
    csBoard.csUser.userNick,
    csBoard.csTitle,
    csBoard.csCont,
    csBoard.csType,
    csBoard.isSecret,
    csBoard.isUserWaiting,
    csBoard.isComplete,
    csBoard.regAt,
    csBoard.uptAt,
    csBoard.fundUuid,
    csComments
  );
}
function convertToCsCommentsDto(csComment: CsComment): CsCommentDto {
  return new CsCommentDto(
    csComment.csComId,
    csComment.csComUser.userNick,
    csComment.csComCont,
    csComment.regAt,
    csComment.isMod
  )
}
@Injectable()
export class CsBoardService {
  constructor(
    @InjectRepository(CsBoard)
    private readonly csRepository: Repository<CsBoard>,
    @InjectRepository(CsComment)
    private readonly csComRepository: Repository<CsComment>,
    private readonly validCheck: ValidCheck,
    private readonly g2gException: GiftogetherExceptions

  ){}

  // 상세 조회
  async findOne(csId: number, user: User) {
    const csBoard = await this.csRepository
      .createQueryBuilder('csBoard')
      .leftJoinAndSelect('csBoard.csUser', 'csUser')
      .leftJoinAndSelect('csBoard.csComments', 'csComments', 'csComments.isDel = false')
      .leftJoinAndSelect('csComments.csComUser', 'csComUser')
      .where('csBoard.csId = :csId AND csBoard.isDel = false', { csId })
      .getOne();

    if (csBoard.isSecret && user.isAdmin) {
      await this.validCheck.verifyUserMatch(csBoard.csUser.userId, user.userId);
    }
    const csCommentsDto =  csBoard?.csComments.map(convertToCsCommentsDto) ?? [];
    return convertToCsBoardDto(csBoard, csCommentsDto);
  }


  async findAll(csType: CsType | null): Promise<CsBoardDto[]> {
    const query = this.csRepository.createQueryBuilder('csBoard')
      .leftJoinAndSelect('csBoard.csUser', 'csUser')
      .andWhere('csBoard.isDel = false');
  
    if (csType !== null) {
      query.andWhere('csBoard.csType = :csType', { csType });
    } else {
      query.andWhere('csBoard.csType IS NULL');
    }
  
    const csBoards = await query.getMany();
    return csBoards?.map(csBoard => convertToCsBoardDto(csBoard, null)) ?? [];
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
    const savedBoard = await this.csRepository.save(csBoard);
    return convertToCsBoardDto(savedBoard, null)
  }

  async update(csId: number, updateCsBoardDto: UpdateCsBoardDto, user: User) {

    const csBoard = await this.csRepository
      .createQueryBuilder('csBoard')
      .leftJoinAndSelect('csBoard.csUser', 'csUser')
      .where('csBoard.csId = :csId AND csBoard.isDel = false', { csId })
      .getOne();
    
    if (!csBoard) {
      throw this.g2gException.CsBoardNotFound;
    }

    console.log("find target csBoard.csId >>> ", csBoard.csId);
    if (!user.isAdmin) {
      await this.validCheck.verifyUserMatch(csBoard.csUser.userId, user.userId);
    }
    
    Object.assign(csBoard, updateCsBoardDto);

    await this.csRepository.save(csBoard);


    console.log("Success update csBoard >>> ", csId);

    return convertToCsBoardDto(csBoard, null)
  }

  async delete(csId: number, user: User) {
    const csBoard = await this.csRepository.findOne({
      where: { csId, isDel: false } ,
      relations: ['csUser', 'csComments', 'csComments.csComUser']
    });

    if (!csBoard) {
      throw this.g2gException.CsBoardNotFound;
    }
    
    console.log("find target csBoard before Delete >>> ", csBoard.csId);
    if (!user.isAdmin) {
      await this.validCheck.verifyUserMatch(csBoard.csUser.userId, user.userId);
    }
    
    csBoard.isDel = true;
    const csComments = csBoard.csComments;

    for (let csComment of csComments) {
      csComment.isDel = true;
    }

    await this.csComRepository.save(csComments)
    await this.csRepository.save(csBoard);
    
    console.log("Success Delete CsBoard >> ", csBoard.csId);
    const convertCsComments: CsCommentDto[] = [];
    for (const csComment of csComments) {
      convertCsComments.push(convertToCsCommentsDto(csComment));
    }
    
    return convertToCsBoardDto(csBoard, convertCsComments);
  }
  
}