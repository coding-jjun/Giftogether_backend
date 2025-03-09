import { Injectable } from '@nestjs/common';
import { IImageId } from 'src/interfaces/image-id.interface';
import { ImageService } from './image.service';
import { Image } from 'src/entities/image.entity';
import { SelectQueryBuilder } from 'typeorm';
import { ImageType } from 'src/enums/image-type.enum';
import { User } from 'src/entities/user.entity';
import { Funding } from 'src/entities/funding.entity';
import { Gift } from 'src/entities/gift.entity';

@Injectable()
export class ImageInstanceManager {
  constructor(private readonly imageService: ImageService) {}

  async getImages<T extends IImageId>(entity: T): Promise<Image[]> {
    if (entity.defaultImgId) {
      // defaultImgId가 존재하면 해당 이미지만 반환
      const defaultImg = await this.imageService.getInstanceByPK(
        entity.defaultImgId,
      );
      return [defaultImg];
    }
    // defaultImgId가 없으면 subId를 사용해 관련 이미지 반환
    return this.imageService.getInstancesBySubId(
      entity.imageType,
      entity.imgSubId,
    );
  }

  /**
   * The function inspects the alias’s metadata to determine the entity type.
   * It then uses that to build a join condition that first checks if the entity’s
   * defaultImgId is set (in which case it matches image.imgId to defaultImgId). If not,
   * it falls back to matching image.subId to the entity’s id field (userId, fundId, or giftId)
   * and image.imgType to the proper ImageType.
   *
   * @param qb    The TypeORM query builder for one of the entities.
   * @param alias 매핑하고 싶은 엔티티의 alias를 명시, e.g. mapImage(fundingQb, 'author')
   * 2025-03-09 edit: 네스팅된 엔티티에도 사용가능! mapImage 하기 전에 연관 엔티티와 join을 수행해야 하겠죠?
   *
   * @returns     The query builder with the left join mapped to the `image` property.
   * @see https://orkhan.gitbook.io/typeorm/docs/select-query-builder#joining-and-mapping-functionality
   * @example
     const fundingQb = this.fundingRepository
      .createQueryBuilder('funding')
      .leftJoinAndSelect(
        'funding.comments',
        'comment',
        'comment.isDel = :isDel',
        { isDel: false },
      )
      .leftJoinAndSelect('comment.author', 'author') // *** funding.comment.'author'
      .where('funding.fundUuid = :fundUuid', { fundUuid })
      .orderBy('comment.regAt', 'DESC');

    // *** NOTE - 이런 식으로 매핑하고 싶은 엔티티 alias를 붙여주면 됩니다.
    this.imageInstanceManager.mapImage(fundingQb, 'author');
    this.imageInstanceManager.mapImage(fundingQb, 'funding');

    const funding = await fundingQb.getOne();
    console.log(funding.image.imgUrl);
    console.log(funding.author.image.imgUrl);

    const authorQb = this.userRepository
      .createQueryBuilder('author')
      .where('author.userId = :userId', { userId: user.userId! });

    // NOTE - 또는 아래와 같이 alias를 생략하면 query builder의 main alias가 자동으로 사용됩니다.
    this.imageInstanceManager.mapImage(authorQb); // 'user'가 자동으로 설정.
   */
  mapImage(
    qb: SelectQueryBuilder<any>,
    alias?: string,
  ): SelectQueryBuilder<any> {
    // Use provided alias or fall back to the query builder's own alias.
    const entityAlias = alias || qb.alias;

    // Determine the correct id field and image type by inspecting the query builder's metadata.
    let idField: string;
    let imgType: ImageType;
    const joinedAlias = qb.expressionMap.findAliasByName(entityAlias);
    const target = joinedAlias.metadata.target;

    if (target === User) {
      idField = 'userId';
      imgType = ImageType.User;
    } else if (target === Funding) {
      idField = 'fundId';
      imgType = ImageType.Funding;
    } else if (target === Gift) {
      idField = 'giftId';
      imgType = ImageType.Gift;
    } else {
      throw new Error(`mapImage does not support entity type: ${target}`);
    }

    // Build the left join condition:
    // If defaultImgId is set then join on image.imgId;
    // otherwise, join on image.subId matching the entity id and image.imgType.
    return qb.leftJoinAndMapOne(
      `${entityAlias}.image`, // the property to map the result to (e.g. user.image)
      'image', // the Image entity
      `${entityAlias}Image`, // alias for the joined image table
      `
      (${entityAlias}.defaultImgId IS NOT NULL AND ${entityAlias}Image.imgId = ${entityAlias}.defaultImgId)
      OR
      (${entityAlias}.defaultImgId IS NULL AND ${entityAlias}Image.subId = ${entityAlias}.${idField} AND ${entityAlias}Image.imgType = :imgType)
    `,
      { imgType },
    );
  }

  mapImages(
    qb: SelectQueryBuilder<any>,
    alias?: string,
  ): SelectQueryBuilder<any> {
    // Use provided alias or fall back to the query builder's own alias.
    const entityAlias = alias || qb.alias;

    // Determine the correct id field and image type by inspecting the query builder's metadata.
    let idField: string;
    let imgType: ImageType;
    const joinedAlias = qb.expressionMap.findAliasByName(entityAlias);
    const target = joinedAlias.metadata.target;

    if (target === User) {
      idField = 'userId';
      imgType = ImageType.User;
    } else if (target === Funding) {
      idField = 'fundId';
      imgType = ImageType.Funding;
    } else if (target === Gift) {
      idField = 'giftId';
      imgType = ImageType.Gift;
    } else {
      throw new Error(`mapImage does not support entity type: ${target}`);
    }

    // Build the left join condition:
    // If defaultImgId is set then join on image.imgId;
    // otherwise, join on image.subId matching the entity id and image.imgType.
    return qb.leftJoinAndMapMany(
      `${entityAlias}.image`, // the property to map the result to (e.g. user.image)
      'image', // the Image entity
      `${entityAlias}Image`, // alias for the joined image table
      `
      (${entityAlias}.defaultImgId IS NOT NULL AND ${entityAlias}Image.imgId = ${entityAlias}.defaultImgId)
      OR
      (${entityAlias}.defaultImgId IS NULL AND ${entityAlias}Image.subId = ${entityAlias}.${idField} AND ${entityAlias}Image.imgType = :imgType)
    `,
      { imgType },
    );
  }

  /**
   * 이미지 Update 수행중 새 이미지 URL로 교체하는 유스케이스에 대응합니다.
   * 기본이미지로 교체하고 싶다면 `resetToDefault`를 사용하세요.
   * TODO - Implement
   * @param newImageUrls not default image URL
   */
  async overwrite<T extends IImageId>(
    entity: T,
    newImageUrls: string[],
  ): Promise<string[]> {
    throw new Error('Not Implemented');
  }

  /**
   * 이미지 Update 수행 중 기존에 이미지를 삭제하고 기본 이미지로 교체하는
   * 유스케이스에 대응합니다.
   *
   * TODO - Implement
   * @param defaultImgId 여기에선 이 id가 기본 이미지인지 여부를 검사하지 않습니다.
   */
  async resetToDefault<T extends IImageId>(
    entity: T,
    defaultImgId: number,
  ): Promise<string> {
    throw new Error('Not Implemented');
  }
}
