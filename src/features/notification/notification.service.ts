import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'src/entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { User } from 'src/entities/user.entity';
import { NotiDto } from './dto/notification.dto';
import { NotiType } from 'src/enums/noti-type.enum';
import { Donation } from 'src/entities/donation.entity';
import { Funding } from 'src/entities/funding.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { ImageType } from 'src/enums/image-type.enum';
import { Image } from 'src/entities/image.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notiRepository: Repository<Notification>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Funding)
    private fundRepository: Repository<Funding>,

    @InjectRepository(Donation)
    private donationRepository: Repository<Donation>,
  ) {}

  async getAllNoti(
    userId: number,
    notiFilter: 'all' | 'friend' | 'funding' | 'comment',
    lastId?: number,
  ): Promise<{ noti: NotiDto[]; count: number; lastId: number; }> {
    const queryBuilder = this.notiRepository
      .createQueryBuilder('notification')
      .orderBy('notification.notiTime', 'DESC')
      .where('notification.recvId = :userId', { userId });
      
    switch (notiFilter) {
    case 'all':
      break;
    case 'friend':
      queryBuilder.andWhere('notification.notiType IN (:...friendTypes)', {
        friendTypes: [NotiType.IncomingFollow, NotiType.NewFriend],
      });
      break;
      case 'funding':
      queryBuilder.andWhere('notification.notiType IN (:...fundingTypes)', {
        fundingTypes: [
          NotiType.FundClose, 
          NotiType.FundAchieve, 
          NotiType.NewDonate, 
          NotiType.WriteGratitude,
          NotiType.CheckGratitude,
          NotiType.DonatedFundClose
        ],
      });
      break;
      case 'comment':
      queryBuilder.andWhere('notification.notiType = :notiType', { 
        notiType: NotiType.NewComment 
      });
      break;
    }
    
    // lastDate가 제공되었다면, 이를 사용하여 조건 추가
    if (lastId) {
      queryBuilder.andWhere('notification.notiId < :lastId', { lastId });
    }

    const notifications = await queryBuilder
    .take(10)
    .leftJoinAndSelect('notification.recvId', 'receiver')
    .leftJoinAndSelect('notification.sendId', 'sender')
    .leftJoinAndMapOne('sender.image', Image, 'image', 'sender.defaultImgId = image.imgId OR (sender.defaultImgId IS NULL AND image.subId = sender.userId AND image.imgType = :userType)', { userType: ImageType.User })
    .getMany();

    const notiDtos = notifications.map(noti => new NotiDto(noti));

    const fundingTypes = [NotiType.FundClose, NotiType.FundAchieve, NotiType.NewDonate, NotiType.WriteGratitude, NotiType.CheckGratitude, NotiType.DonatedFundClose, NotiType.NewComment];
    const fundUuids = notifications.filter(noti => fundingTypes.includes(noti.notiType)).map(noti => noti.subId);
    
    if (fundUuids.length > 0) {
      const fundings = await this.fundRepository
        .createQueryBuilder('funding')
        .where('funding.fundUuid IN (:...fundUuids)', { fundUuids })
        .getMany();
    
      const fundingMap = new Map(fundings.map(fund => [fund.fundUuid, fund.fundTitle]));
    
      notiDtos.forEach(notiDto => {
        if (fundingTypes.includes(notiDto.notiType)) {
          notiDto.fundTitle = fundingMap.get(notiDto.subId);
        }
      });
    }
    
    return {
      noti: notiDtos,
      count: notiDtos.length,
      lastId: notiDtos.length > 0 ? notiDtos[notiDtos.length - 1].notiId : 0,
    };
  }

  async createNoti(
    createNotiDto: CreateNotificationDto,
  ): Promise<Notification> {
    const noti = new Notification();
    const receiver = await this.userRepository.findOneBy({ userId: createNotiDto.recvId })
    const sender = await this.userRepository.findOneBy({ userId: createNotiDto.sendId })

    noti.sendId = sender;
    noti.recvId = receiver;
    noti.notiType = createNotiDto.notiType;
    noti.subId = createNotiDto.subId;

    return await this.notiRepository.save(noti);
  }

  async createMultiNoti(
    createNotiDto: CreateNotificationDto,
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    let funding;
    let donations;
    switch (createNotiDto.notiType) {
      case (NotiType.CheckGratitude):
        funding = await this.fundRepository.findOne({
          where: { fundId: Number(createNotiDto.subId) },
          relations: ['fundUser']
        });        

        donations = await this.donationRepository.find({
          where: { funding: { fundId: Number(createNotiDto.subId) } },
          relations: ['user']
        });
        break;
      case (NotiType.DonatedFundClose):
        funding = await this.fundRepository.findOne({
          where: { fundUuid: createNotiDto.subId },
          relations: ['fundUser']
        })

        donations = await this.donationRepository.find({
          where: { funding: { fundUuid: createNotiDto.subId } },
          relations: ['user']
        });
        break;
    }

    console.log("--------------funding.fundId :" + funding.fundId);

    for (const donation of donations) {
      const noti = new Notification();
      noti.recvId = donation.user;
      noti.sendId = funding.fundUser;
      noti.notiType = createNotiDto.notiType;
      noti.subId = createNotiDto.subId

      const savedNoti = await this.notiRepository.save(noti);
      notifications.push(savedNoti);
    }

    return notifications;
  }

  async updateNoti(
    notiId: number,
    updateNotiDto: UpdateNotificationDto,
  ): Promise<Notification> {
    if (notiId) {
      const noti = await this.notiRepository.findOne({
        where: { notiId },
      });
      if (noti) {
        await this.notiRepository.save(noti);
        return noti;
      }
    } else {
      const noti = await this.notiRepository.findOne({
        where: { 
          recvId: { userId: updateNotiDto.userId }, 
          sendId: { userId: updateNotiDto.friendId },
          notiType: NotiType.IncomingFollow,
        },
      });
      if (noti) {
        await this.notiRepository.save(noti);
        return noti;
      }
    }
  }

  async readNoti(
    lastTime: Date,
    userId: number,
  ): Promise<void> {
    const newTime = new Date(lastTime);
    const utcLastTime = new Date(newTime.getTime() - newTime.getTimezoneOffset() * 60000);
    
    await this.notiRepository.createQueryBuilder()
    .update(Notification)
    .set({ isRead: true })
    .where('recvId = :userId', { userId })
    .andWhere('notiTime <= :utcLastTime', { utcLastTime })
    .andWhere('isRead = false')
    .execute();
  }

  async checkUnread(
    userId: number,
  ): Promise<boolean> {
    const lastNotification = await this.notiRepository
    .createQueryBuilder('notification')
    .where('notification.recvId = :userId', { userId })
    .orderBy('notification.notiTime', 'DESC')
    .getOne();

    return lastNotification ? !lastNotification.isRead : false;
  }
}
