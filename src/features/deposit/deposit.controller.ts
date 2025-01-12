import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositDto } from './dto/deposit.dto';
import { CommonResponse } from '../../interfaces/common-response.interface';
import { GiftogetherExceptions } from '../../filters/giftogether-exception';

@Controller('deposits')
export class DepositController {
  constructor(
    private readonly depositService: DepositService,
    private readonly g2gException: GiftogetherExceptions,
  ) {}

  @Get()
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 0,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ): Promise<CommonResponse> {
    if (page < 0) {
      throw this.g2gException.InvalidPage;
    }
    if (limit < 0) {
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
    @Body() depositData: DepositDto,
  ): Promise<CommonResponse> {
    return {
      message: '성공적으로 입금내역이 추가되었습니다.',
      data: await this.depositService.uploadDeposit(depositData),
    };
  }
}
