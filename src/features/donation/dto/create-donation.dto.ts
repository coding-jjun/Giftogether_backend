import { IsOptional, IsString, IsNumber, Validate } from 'class-validator';
import { CreateGuestDto } from './create-guest.dto';
import { CustomUrlValidator } from 'src/util/custom-url-validator';

export class CreateDonationDto {
  @IsOptional()
  guest: CreateGuestDto;

  @IsNumber()
  donAmnt: number;

  @IsOptional()
  @IsString()
  rollMsg: string;

  /*
   * fundImg와 defaultImgId 둘 중에 하나만 null이어야 함
   */
  @IsOptional()
  @Validate(CustomUrlValidator)
  rollImg: string;

  /*
   * fundImg와 defaultImgId 둘 중에 하나만 null이어야 함
   */
  @IsOptional()
  @IsNumber()
  defaultImgId?: number;

  @IsString()
  senderSig: string; // 홍길동-1234
}
