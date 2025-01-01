import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from 'src/entities/notification.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { Repository } from 'typeorm';

@Injectable()
export class CreateNotificationsUseCase {
  constructor(
    @InjectRepository(Notification)
    private readonly notiRepo: Repository<Notification>,
  ) {}

  async execute(...cmd: CreateNotificationDto[]): Promise<void> {
    this.notiRepo
      .createQueryBuilder('notification')
      .insert()
      .into(Notification)
      .values(cmd.map((dto) => Notification.create(dto)))
      .execute();
  }
}
