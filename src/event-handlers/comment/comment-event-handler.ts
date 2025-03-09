import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Funding } from "src/entities/funding.entity";
import { Notification } from "src/entities/notification.entity";
import { User } from "src/entities/user.entity";
import { NotiType } from "src/enums/noti-type.enum";
import { Repository } from "typeorm";

@Injectable()
export class CommentEventHandler {
  constructor(
    @InjectRepository(Notification)
    private notiRepository: Repository<Notification>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Funding)
    private fundRepository: Repository<Funding>,
  ) {}

  @OnEvent('NewComment')
  async handleNewComment(data: { fundId: number, authorId: number }) {
    const noti = new Notification();
    const funding = await this.fundRepository.findOne({
      where: { fundId: data.fundId },
      relations: ['fundUser'],
    });
    const sender = await this.userRepository.findOne({ where: { userId: data.authorId }});

    noti.recvId = funding.fundUser;
    noti.sendId = sender;
    noti.notiType = NotiType.NewComment;
    noti.subId = funding.fundUuid;

    return this.notiRepository.save(noti);
  }
}