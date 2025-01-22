import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  ParseIntPipe,
  Delete,
  UseGuards,
  Req,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositDto } from './dto/deposit.dto';
import { CommonResponse } from '../../interfaces/common-response.interface';
import { GiftogetherExceptions } from '../../filters/giftogether-exception';
import { JwtAuthGuard } from '../auth/guard/jwt-auth-guard';
import { Request } from 'express';
import { User } from 'src/entities/user.entity';
import { CreateDepositDto } from './dto/create-deposit.dto';

@Controller('deposits')
export class DepositController {
  constructor(
    private readonly depositService: DepositService,
    private readonly g2gException: GiftogetherExceptions,
  ) {}

  @Get()
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number,
  ): Promise<CommonResponse> {
    if (page <= 0) {
      throw this.g2gException.InvalidPage;
    }
    if (limit <= 0) {
      throw this.g2gException.InvalidLimit;
    }
    return {
      message: '성공적으로 입금내역을 조회했습니다.',
      data: await this.depositService.findAll(page, limit),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<CommonResponse> {
    return {
      message: '성공적으로 입금내역을 조회했습니다.',
      data: await this.depositService.findOne(id),
    };
  }

  @Post()
  async uploadDeposit(
    @Body() depositData: CreateDepositDto,
  ): Promise<CommonResponse> {
    return {
      message: '성공적으로 입금내역이 추가되었습니다.',
      data: await this.depositService.uploadDeposit(depositData),
    };
  }

  /**
   * 관리자는 입금내역을 바로 삭제할 수 없습니다. 대신 입금내역을 삭제요청을 시스템에게 보내고
   * 시스템은 입금내역을 삭제하는 이벤트를 발송합니다. 자세한 내용은 [Deposit 삭제요청 및 삭제처리](https://www.notion.so/Deposit-294de66d7ad64e669f3eaed80f68df38?pvs=4) 문서를 참고하세요.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async requestDeleteDeposit(
    @Req() req: Request,
    @Param('id') id: number,
  ): Promise<CommonResponse> {
    const user = req.user! as User;
    return {
      message:
        '성공적으로 입금내역 삭제요청이 완료되었습니다. Notification을 확인해주세요.',
      data: await this.depositService.requestDeleteDeposit(id, user.userId),
    };
  }
}
