import { IsNotEmpty, IsOptional } from 'class-validator';
import { NotiType } from 'src/enums/noti-type.enum';

export class CreateNotificationDto {
  @IsNotEmpty()
  recvId: number;

  @IsNotEmpty()
  sendId: number;

  @IsNotEmpty()
  notiType: NotiType;

  @IsOptional()
  subId?: string;

  constructor(dto: Partial<CreateNotificationDto>) {
    Object.assign(this, dto);
  }
}
