import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

/**
 * 시스템이 관리자에게 전달해야 하는 Notification이 있을 경우 사용하는 유스케이스입니다.
 *
 * TODO: 추후 Event Subscriber가 도입되면 NotificationAudienceService으로
 * 확장이 되어 특정 알림을 구독한 사용자들을 대신 찾아주는 도메인 서비스가 될 예정입니다.
 */
@Injectable()
export class FindAllAdminsUseCase {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async execute(): Promise<User[]> {
    return this.userRepo.find({ where: { isAdmin: true } });
  }
}
