import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from 'src/entities/comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Funding } from 'src/entities/funding.entity';
import { GetCommentDto } from './dto/get-comment.dto';
import { User } from 'src/entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { ValidCheck } from 'src/util/valid-check';
import { ImageInstanceManager } from '../image/image-instance-manager';
import { ImageType } from 'src/enums/image-type.enum';
import { SelectQueryBuilder } from 'typeorm/browser';

function convertToGetCommentDto(comment: Comment): GetCommentDto {
  const { comId, content, regAt, isMod, authorId, author } = comment;
  const authorName = author?.userName ?? 'ANONYMOUS';
  return new GetCommentDto(
    comId,
    content,
    regAt,
    isMod,
    authorId,
    authorName,
    author?.image?.imgUrl,
  );
}

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment) private commentRepository: Repository<Comment>,
    @InjectRepository(Funding) private fundingRepository: Repository<Funding>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private eventEmitter: EventEmitter2,
    private readonly g2gException: GiftogetherExceptions,
    private readonly validCheck: ValidCheck,
    private readonly imageInstanceManager: ImageInstanceManager,
  ) {}

  async create(
    user: Partial<User>,
    fundUuid: string,
    createCommentDto: CreateCommentDto,
  ): Promise<GetCommentDto> {
    const { content } = createCommentDto;

    const where = { fundUuid };
    const funding = await this.fundingRepository.findOne({ where });
    if (!funding) {
      throw this.g2gException.FundingNotExists;
    }
    const authorQb = this.userRepository
      .createQueryBuilder('author')
      .where('author.userId = :userId', { userId: user.userId! });

    this.imageInstanceManager.mapImage(authorQb);

    const author = await authorQb.getOne();
    if (!author) {
      throw this.g2gException.UserNotFound;
    }

    const newComment = new Comment({
      funding,
      fundId: funding.fundId,
      author,
      authorId: author.userId,
      content,
    });

    await this.commentRepository.insert(newComment);

    this.eventEmitter.emit('NewComment', {
      fundId: funding.fundId,
      authorId: author.userId,
    });

    return convertToGetCommentDto(newComment);
  }

  /**
   * 연관 펀딩에 달린 모든 삭제되지 않은 댓글들을 반환한다.
   * @param fundUuid
   * @returns Comment[]
   */
  async findMany(fundUuid: string): Promise<GetCommentDto[]> {
    const fundingQb = this.fundingRepository
      .createQueryBuilder('funding')
      .leftJoinAndSelect(
        'funding.comments',
        'comment',
        'comment.isDel = :isDel',
        { isDel: false },
      )
      .leftJoinAndSelect('comment.author', 'author')
      .where('funding.fundUuid = :fundUuid', { fundUuid })
      .orderBy('comment.regAt', 'DESC');

    this.imageInstanceManager.mapImage(fundingQb, 'author');
    // this.imageInstanceManager.mapImage(fundingQb, 'funding'); //  이런 식으로 매핑하고 싶은 엔티티 alias를 붙여주면 됩니다.

    const funding = await fundingQb.getOne();
    if (!funding) {
      throw this.g2gException.FundingNotExists;
    }

    return funding?.comments.map(convertToGetCommentDto) ?? [];
  }

  async update(
    user: Partial<User>,
    fundUuid: string,
    comId: number,
    updateCommentDto: UpdateCommentDto,
  ): Promise<GetCommentDto> {
    const { content } = updateCommentDto;

    const commentQb = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.funding', 'funding')
      .leftJoinAndSelect('comment.author', 'author')
      .where('comment.comId = :comId AND funding.fundUuid = :fundUuid', {
        comId,
        fundUuid,
      });
    this.imageInstanceManager.mapImage(commentQb, 'author');

    const comment = await commentQb.getOne();
    if (!comment) {
      throw this.g2gException.CommentNotFound;
    }
    // 오직 본인만이 자신이 작성한 댓글을 수정할 수 있다.
    await this.validCheck.verifyUserMatch(user.userId, comment.authorId);

    comment.content = content;
    comment.isMod = true;

    this.commentRepository.save(comment);

    comment.author.image = await this.imageInstanceManager
      .getImages(comment.author)
      .then((images) => images[0]);
    return convertToGetCommentDto(comment);
  }

  /**
   * soft delete
   */
  async remove(user: Partial<User>, fundUuid: string, comId: number) {
    const commentQb = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.funding', 'funding')
      .leftJoinAndSelect('comment.author', 'author')
      .where('comment.comId = :comId AND funding.fundUuid = :fundUuid', {
        comId,
        fundUuid,
      });

    const comment = await commentQb.getOne();
    if (!comment) {
      throw this.g2gException.CommentNotFound;
    }
    // 오직 본인만이 자신이 작성한 댓글을 삭제할 수 있다.
    await this.validCheck.verifyUserMatch(user.userId, comment.authorId);

    comment.isDel = true;
    this.commentRepository.save(comment);

    return convertToGetCommentDto(comment);
  }
}
