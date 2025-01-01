import { NotiType } from 'src/enums/noti-type.enum';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { CreateNotificationDto } from 'src/features/notification/dto/create-notification.dto';
import { NotImplementedException } from '@nestjs/common';

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn()
  notiId: number;

  @ManyToOne(() => User, (user) => user.userId)
  @JoinColumn({ name: 'recvId' })
  recvId: User;

  @ManyToOne(() => User, (user) => user.userId)
  @JoinColumn({ name: 'sendId' })
  @Column({ nullable: true }) // nullable true인 이유는 시스템이 알림을 보낼 수도 있기 때문.
  sendId: User;

  @Column({ type: 'enum', enum: NotiType })
  notiType: NotiType;

  @Column({ nullable: true })
  subId: string;

  @CreateDateColumn()
  notiTime: Date;

  @Column({ default: false })
  isRead: boolean;

  constructor(data?: Partial<Notification>) {
    if (data) {
      Object.assign(this, data);
    }

    this.isRead = false;
  }

  static create(data: CreateNotificationDto): Notification;
  static create(data: Partial<Notification>): Notification;

  static create(
    data: CreateNotificationDto | Partial<Notification>,
  ): Notification {
    if (data instanceof CreateNotificationDto) {
      const { recvId, sendId, notiType, subId } = data;

      const instance = new Notification({ notiType, subId });

      // assign user property only with PK
      instance.recvId = { userId: recvId } as User;
      instance.sendId = { userId: sendId ?? null } as User;

      return instance;
    } else if (data instanceof Notification) {
      return new Notification(data);
    } else {
      throw new NotImplementedException();
    }
  }
}
