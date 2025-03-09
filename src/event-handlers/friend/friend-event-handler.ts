import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Notification } from "src/entities/notification.entity";
import { User } from "src/entities/user.entity";
import { NotiType } from "src/enums/noti-type.enum";
import { FriendDto } from "src/features/friend/dto/friend.dto";
import { Repository } from "typeorm";

@Injectable()
export class FriendEventHandler {
    constructor(
        @InjectRepository(Notification)
        private readonly notiRepository: Repository<Notification>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}
    

    @OnEvent('AcceptFollow')
    async handleAcceptFollow(userId: number, friendDto: FriendDto) {
        const noti1 = new Notification();
        const noti2 = new Notification();
        const receiver = await this.userRepository.findOneBy({ userId: friendDto.friendId })
        const sender = await this.userRepository.findOneBy({ userId: userId })

        noti1.sendId = sender;
        noti1.recvId = receiver;
        noti2.sendId = receiver;
        noti2.recvId = sender;
        noti1.notiType = NotiType.NewFriend;
        noti2.notiType = NotiType.NewFriend;

        if (!friendDto.notiId) {
        const deleteNoti = await this.notiRepository.createQueryBuilder("notification")
        .leftJoinAndSelect("notification.recvId", "receiver")
        .where("notification.recvId = :recvId", { recvId: userId })
        .andWhere("notification.sendId = :sendId", { sendId: friendDto.friendId }) // 여기서 senderId는 숫자 타입이어야 합니다.
        .andWhere("notification.notiType = :notiType", { notiType: NotiType.IncomingFollow })
        .getOne();

        if (deleteNoti) {
            await this.notiRepository.delete(deleteNoti.notiId);
        };
        } else {
        await this.notiRepository.delete(friendDto.notiId);
        }

        await this.notiRepository.save(noti1);
        await this.notiRepository.save(noti2);
        
        return;
    }

    @OnEvent('IncomingFollow')
    async handleIncomingFollow(userId: number, friendDto: FriendDto) {
        const noti = new Notification();
        const receiver = await this.userRepository.findOneBy({ userId: friendDto.friendId })
        const sender = await this.userRepository.findOneBy({ userId: userId })

        noti.sendId = sender;
        noti.recvId = receiver;
        noti.notiType = NotiType.IncomingFollow;

        return await this.notiRepository.save(noti);
    }
}