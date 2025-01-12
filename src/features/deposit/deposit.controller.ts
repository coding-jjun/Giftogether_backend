import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositDto } from './dto/deposit.dto';
import { CommonResponse } from '../../interfaces/common-response.interface';

@Controller('deposits')
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<CommonResponse> {
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
