import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Funding } from 'src/entities/funding.entity';
import { Gift } from 'src/entities/gift.entity';
import { Repository } from 'typeorm';
import { RequestGiftDto } from './dto/request-gift.dto';
import { ResponseGiftDto } from './dto/response-gift.dto';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { ImageType } from 'src/enums/image-type.enum';
import { Image } from 'src/entities/image.entity';
import {
  DefaultImageIds,
  getRandomDefaultImgId,
} from 'src/enums/default-image-id';
import { ImageService } from '../image/image.service';
import { User } from 'src/entities/user.entity';
import { ImageInstanceManager } from '../image/image-instance-manager';

@Injectable()
export class GiftService {
  constructor(
    @InjectRepository(Gift)
    private readonly giftRepository: Repository<Gift>,

    private readonly g2gException: GiftogetherExceptions,

    private readonly imgService: ImageService,

    private readonly imageManager: ImageInstanceManager,
  ) {}

  async findAllGift(fund: Funding): Promise<{
    gifts: ResponseGiftDto[];
    giftImgUrls: string[];
    count: number;
  }> {
    const qb = this.giftRepository
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.funding', 'f', 'g.fundId = :fundId')
      .where('g.fundId = :fundId', {
        fundId: fund.fundId,
      })
      .orderBy('g.giftOrd', 'ASC');
    this.imageManager.mapImage(qb);
    const [gifts, count] = await qb.getManyAndCount();

    // Gift 배열을 ResponseGiftDto 배열로 변환
    const responseGifts = await Promise.all(
      gifts.map(async (gift) => {
        return new ResponseGiftDto(gift, gift.image.imgUrl);
      }),
    );

    const giftImgUrls: string[] = gifts.map((g) => g.image.imgUrl);

    return { gifts: responseGifts, giftImgUrls, count };
  }

  private async getGiftImageUrl(
    gift: Gift,
  ): Promise<{ imgUrl: string | null; isDef: boolean }> {
    const image: Image = await this.imageManager
      .getImages(gift)
      .then((v) => v[0]);
    return { imgUrl: image?.imgUrl, isDef: !!gift.defaultImgId };
  }

  async createOrUpdateGift(
    funding: Funding,
    gifts: RequestGiftDto[],
    creator: User,
  ): Promise<ResponseGiftDto[]> {
    // 기존 Funding에 연결된 모든 Gift 조회
    const existingGifts = await this.giftRepository.find({
      where: { funding: { fundId: funding.fundId } },
    });

    // 삭제할 Gift를 추적하기 위한 Set
    const existingGiftIds = new Set(existingGifts.map((gift) => gift.giftId));

    // 요청된 Gift 목록을 순회하면서 업데이트하거나 새로운 Gift를 추가
    const resultGifts = await Promise.all(
      gifts.map(async (gift) => {
        if (gift.giftId) {
          // giftId가 존재하면 기존 Gift를 업데이트
          const updatedGift = await this.updateGift(funding, gift, creator);
          existingGiftIds.delete(gift.giftId); // 업데이트된 Gift는 삭제 대상에서 제외
          return updatedGift;
        } else {
          // giftId가 없으면 새로운 Gift 생성
          const newGift = await this.createNewGift(funding, gift, creator);
          return newGift;
        }
      }),
    );

    // 삭제 로직 실행: existingGiftIds에 남아 있는 giftId는 삭제 대상
    await this.deleteGift(existingGifts, existingGiftIds);

    return resultGifts;
  }

  private async updateGift(
    funding: Funding,
    gift: RequestGiftDto,
    creator: User,
  ): Promise<ResponseGiftDto> {
    const existGift = await this.giftRepository.findOne({
      where: { giftId: gift.giftId },
    });

    if (!existGift) {
      throw this.g2gException.GiftNotFound;
    }

    // Update gift properties
    existGift.giftUrl = gift.giftUrl;
    existGift.giftOrd = gift.giftOrd;
    existGift.giftOpt = gift.giftOpt;
    existGift.giftCont = gift.giftCont;
    existGift.funding = funding;

    const imgUrl = gift.giftImg
      ? await this.handleGiftImageUpdate(existGift, gift.giftImg, creator)
      : await this.handleGiftImageRemoval(existGift);

    const savedGift = await this.giftRepository.save(existGift);
    return new ResponseGiftDto(savedGift, imgUrl);
  }

  private async handleGiftImageUpdate(
    existGift: Gift,
    newGiftImgUrl: string,
    creator: User,
  ): Promise<string> {
    if (existGift.defaultImgId) {
      existGift.defaultImgId = null; // 기본 이미지를 제거
    } else {
      // 기존 이미지를 조회
      const existImg = await this.imgService.getInstancesBySubId(
        ImageType.Gift,
        existGift.giftId,
      )[0];

      // 기존 이미지가 존재하고 URL이 동일한 경우, 그대로 사용
      if (existImg) {
        if (existImg.imgUrl === newGiftImgUrl) {
          return existImg.imgUrl; // 기존 URL을 그대로 반환
        }
        await this.imgService.delete(ImageType.Gift, existGift.giftId);
      }
    }

    // 새로운 이미지를 저장
    const newImage = await this.saveNewImage(
      newGiftImgUrl,
      existGift.giftId,
      creator,
    );
    return newImage.imgUrl;
  }

  private async handleGiftImageRemoval(existGift: Gift): Promise<string> {
    if (existGift.defaultImgId) {
      // 기본 이미지가 이미 설정되어 있는 경우
      const defaultImage = await this.imgService.getInstanceByPK(
        existGift.defaultImgId,
      );
      return defaultImage.imgUrl;
    } else {
      // 기본 이미지가 설정되어 있지 않다면 기존 이미지를 삭제하고 기본 이미지를 설정
      await this.imgService.delete(ImageType.Gift, existGift.giftId);

      return this.setDefaultGiftImage(existGift);
    }
  }

  private async createNewGift(
    funding: Funding,
    gift: RequestGiftDto,
    creator: User,
  ): Promise<ResponseGiftDto> {
    const newGift = new Gift();

    newGift.giftUrl = gift.giftUrl;
    newGift.giftTitle = gift.giftTitle;
    newGift.giftOrd = gift.giftOrd;
    newGift.giftOpt = gift.giftOpt;
    newGift.giftCont = gift.giftCont;
    newGift.funding = funding;

    const savedGift = await this.giftRepository.save(newGift);

    const imgUrl = gift.giftImg
      ? (await this.saveNewImage(gift.giftImg, savedGift.giftId, creator))
          .imgUrl
      : await this.setDefaultGiftImage(savedGift);

    return new ResponseGiftDto(savedGift, imgUrl);
  }

  private async saveNewImage(
    imgUrl: string,
    giftId: number,
    creator: User,
  ): Promise<Image> {
    return this.imgService.save(imgUrl, creator, ImageType.Gift, giftId);
  }

  private async setDefaultGiftImage(gift: Gift): Promise<string> {
    const defaultImgId = getRandomDefaultImgId(DefaultImageIds.Gift);
    gift.defaultImgId = defaultImgId;

    const defaultImage = await this.imgService.getInstanceByPK(defaultImgId);

    await this.giftRepository.save(gift);
    return defaultImage.imgUrl;
  }

  async delete(...gifts: Gift[]): Promise<Gift[]> {
    const deleteImgPromises = gifts.map(async (g) =>
      this.imgService.delete(ImageType.Gift, g.giftId),
    );
    Promise.all(deleteImgPromises);
    return this.giftRepository.remove(gifts);
  }

  private async deleteGift(
    existingGifts: Gift[],
    existingGiftIds: Set<number>,
  ): Promise<void> {
    // 기존 Gift 중에서 삭제 대상인 Gift 필터링
    const giftsToDelete = existingGifts.filter((existingGift) =>
      existingGiftIds.has(existingGift.giftId),
    );

    // 삭제할 Gift 제거
    if (giftsToDelete.length > 0) {
      const deleteGiftPromises = giftsToDelete.map(async (gift) =>
        this.imgService.delete(ImageType.Gift, gift.giftId),
      );
      await Promise.all(deleteGiftPromises);
      await this.giftRepository.remove(giftsToDelete);
    }
  }

  // async updateGift(
  //   giftId: number,
  //   requestGiftDto: RequestGiftDto,
  // ): Promise<Gift> {
  //   const gift = await this.giftRepository.findOneBy({ giftId });
  //   if (!gift) {
  //     throw new HttpException(
  //       '존재하지 않는 선물입니다.',
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }

  //   gift.giftUrl = requestGiftDto.giftUrl;
  //   gift.giftOrd = requestGiftDto.giftOrd;
  //   gift.giftOpt = requestGiftDto.giftOpt;
  //   gift.giftCont = requestGiftDto.giftCont;

  //   return await this.giftRepository.save(gift);
  // }

  // async deleteGift(giftId: number): Promise<Gift> {
  //   const gift = await this.giftRepository.findOneBy({ giftId });
  //   if (!gift) {
  //     throw new HttpException(
  //       '존재하지 않는 선물입니다.',
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }

  //   await this.giftRepository.delete(gift);

  //   return gift;
  // }
}
