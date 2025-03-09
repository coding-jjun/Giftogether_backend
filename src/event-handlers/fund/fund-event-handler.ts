import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Funding } from "src/entities/funding.entity";
import { Notification } from "src/entities/notification.entity";
import { User } from "src/entities/user.entity";
import { NotiType } from "src/enums/noti-type.enum";
import { Repository } from "typeorm";

@Injectable()
export class FundEventHandler {
  constructor(
    @InjectRepository(Notification)
    private notiRepository: Repository<Notification>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Funding)
    private fundRepository: Repository<Funding>,
  ) {}

  @OnEvent('FundClose')
  async handleFundClose(fundId: number) {
    const funding = await this.fundRepository.findOne({
      where: { fundId },
      relations: ['fundUser', 'donations', 'donations.user']
    });

    // FundClose 알림 생성 및 저장
    const fundCloseNoti = new Notification();
    fundCloseNoti.recvId = funding.fundUser;
    fundCloseNoti.notiType = NotiType.FundClose;
    fundCloseNoti.subId = funding.fundUuid;
    await this.notiRepository.save(fundCloseNoti);

    // DonatedFundClose 이벤트 처리, 기부자들에게 알림 생성
    if (funding.donations && funding.donations.length > 0) {
      const notifications = funding.donations.map(donation => {
      const noti = new Notification();
      noti.recvId = donation.user; // 받는 사람은 기부자
      noti.sendId = funding.fundUser; // 보내는 사람은 펀딩 주최자
      noti.notiType = NotiType.DonatedFundClose; // 알림 타입 설정
      noti.subId = funding.fundUuid;

      return this.notiRepository.save(noti);
      });

      // 모든 알림 저장
      await Promise.all(notifications);
    }
  }

  @OnEvent('FundAchieve')
  async handleFundAchieve(data: {recvId: number, subId: string}) {
    const noti = new Notification();
    const receiver = await this.userRepository.findOneBy({ userId: data.recvId });

    noti.recvId = receiver;
    noti.notiType = NotiType.FundAchieve;
    noti.subId = data.subId;

    return await this.notiRepository.save(noti);
  }
}