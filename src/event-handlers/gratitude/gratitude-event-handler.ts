import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Funding } from "src/entities/funding.entity";
import { Notification } from "src/entities/notification.entity";
import { NotiType } from "src/enums/noti-type.enum";
import { Repository } from "typeorm";

@Injectable()
export class GratitudeEventHandler {
	constructor(
		@InjectRepository(Notification)
		private notiRepository: Repository<Notification>,

		@InjectRepository(Funding)
		private fundRepository: Repository<Funding>,
	) {}
	
	@OnEvent('WriteGratitude')
	async handleWriteGratitude(fundId: number) {
		const noti = new Notification();
		const funding = await this.fundRepository.findOne({
			where: { fundId },
			relations: ['fundUser'],
		});

		noti.recvId = funding.fundUser;
		noti.notiType = NotiType.WriteGratitude;
		noti.subId = funding.fundUuid;

		return this.notiRepository.save(noti);
	}

	@OnEvent('CheckGratitude')
	async handleCheckGratitude(fundId: number) {
		const funding = await this.fundRepository.findOne({
			where: { fundId },
			relations: ['fundUser', 'donations', 'donations.user']
		});
	
		// 해당 펀딩에 기여한 모든 사용자들에게 알림을 생성
		const notifications = funding.donations.map(donation => {
			const noti = new Notification();
			noti.recvId = donation.user; // 받는 사람은 기부자
			noti.sendId = funding.fundUser; // 보내는 사람은 펀딩 주최자
			noti.notiType = NotiType.CheckGratitude; // 알림 타입 설정
			noti.subId = funding.fundUuid;
	
			return this.notiRepository.save(noti);
		});
	
		// 모든 알림을 비동기적으로 저장
		await Promise.all(notifications);
	}	
}