import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DonationService } from './donation.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { CommonResponse } from 'src/interfaces/common-response.interface';
import { JwtAuthGuard } from '../auth/guard/jwt-auth-guard';
import { User } from 'src/entities/user.entity';
import { Request } from 'express';

@Controller('donation')
export class DonationController {
  constructor(private donationService: DonationService) {}

  // // 펀딩페이지에서 후원하기 + 롤링페이퍼 등록
  // @Get(':fundUuid')
  // async findOne(@Param('fundUuid', ParseUUIDPipe) fundUuid: string): Promise<CommonResponse> {

  // 회원 후원 생성
  @Post('/:fundUuid')
  @UseGuards(JwtAuthGuard)
  async createUserDonation(
    @Req() req: Request,
    @Param('fundUuid') fundUuid: string,
    @Body() createDonationDto: CreateDonationDto,
  ): Promise<CommonResponse> {
    const user = req.user as { user: User } as any;
    try {
      return {
        message: 'Donation 생성 완료',
        data: await this.donationService.createUserDonation(
          fundUuid,
          createDonationDto,
          user,
        ),
      };
    } catch (error) {
      throw error;
    }
  }

  // 회원 후원 취소
  @Delete('/:donId')
  @UseGuards(JwtAuthGuard)
  async deleteDonation(@Req() req: Request, @Param('donId') donId: number) {
    const user = req.user as { user: User } as any;
    return {
      message: 'Donation 삭제 성공',
      data: await this.donationService.deleteDonation(user.userId, donId),
    };
  }

  // 비회원 후원 생성
  @Post('/guest/:fundUuid')
  async createGuestDonation(
    @Param('fundUuid') fundUuid: string,
    @Body() createDonationDto: CreateDonationDto,
  ): Promise<CommonResponse> {
    try {
      return {
        message: 'Donation 생성 완료',
        data: await this.donationService.createGuestDonation(
          fundUuid,
          createDonationDto,
        ),
      };
    } catch (error) {
      throw error;
    }
  }

  // 비회원 후원내역 조회
  /**
   * 비회원용 토큰, 후원 내역 조히
   * @param orderId
   * @returns
   */
  @Get('/guest')
  @UseGuards(JwtAuthGuard)
  async getGuestDonation(@Req() req: Request) {
    const user = req.user as { user: User } as any;

    return {
      message: 'Donation 조회 성공',
      data: await this.donationService.getDonationByUserId(user.userId),
    };
  }

  // 비회원 후원 취소
  @Delete('/guest/:orderId')
  async deleteGuestDonation(@Param('orderId') orderId: string) {
    return {
      message: 'Donation 삭제 성공',
      data: await this.donationService.deleteGuestDonation(orderId),
    };
  }
}
