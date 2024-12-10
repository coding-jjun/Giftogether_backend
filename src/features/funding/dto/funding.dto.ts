import { Funding } from 'src/entities/funding.entity';
import { ResponseGiftDto } from 'src/features/gift/dto/response-gift.dto';

export class FundingDto {
  fundId: number;
  fundUuid: string;
  fundUserId: number;
  fundUserNick: string;
  fundUserImg: string;
  fundTitle: string;
  fundCont: string;
  fundTheme: string;
  fundPubl: boolean;
  fundGoal: number;
  fundSum: number;
  fundAddrRoad: string;
  fundAddrDetl: string;
  fundAddrZip: string;
  fundRecvName: string;
  fundRecvPhone: string;
  fundRecvReq?: string;
  regAt: Date;
  endAt: Date;
  gifts: ResponseGiftDto[];
  fundImgUrls: string[];

  constructor(
    funding: Funding,
    fundUserImg: string,
    gifts?: ResponseGiftDto[],
    fundImgUrls?: string[],
  ) {
    this.fundId = funding.fundId;
    this.fundUuid = funding.fundUuid;
    this.fundUserId = funding.fundUser?.userId;
    this.fundUserNick = funding.fundUser?.userNick;
    this.fundTitle = funding.fundTitle;
    this.fundCont = funding.fundCont;
    this.fundTheme = funding.fundTheme;
    this.fundPubl = funding.fundPubl;
    this.fundGoal = funding.fundGoal;
    this.fundSum = funding.fundSum;
    this.fundAddrRoad = funding.fundAddrRoad;
    this.fundAddrDetl = funding.fundAddrDetl;
    this.fundAddrZip = funding.fundAddrZip;
    this.fundRecvName = funding.fundRecvName;
    this.fundRecvPhone = funding.fundRecvPhone;
    this.fundRecvReq = funding.fundRecvReq;
    this.regAt = funding.regAt;
    this.endAt = funding.endAt;
    this.gifts = gifts || [];
    this.fundImgUrls = fundImgUrls || [];
    this.fundUserImg = fundUserImg;
  }
}
