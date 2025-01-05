import { Body, Controller, Post } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositDto } from './dto/deposit.dto';
import { CommonResponse } from '../../interfaces/common-response.interface';

@Controller('deposits')
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

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
