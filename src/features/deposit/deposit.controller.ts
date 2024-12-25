import { Body, Controller, Get, Post } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositDto } from './dto/deposit.dto';
import { CommonResponse } from '../../interfaces/common-response.interface';
import { FindAllDepositsUseCase } from './queries/find-all-deposits.usecase';
import { FindAllDepositsCommand } from './queries/find-all-deposits.command';

@Controller('deposits')
export class DepositController {
  constructor(
    private readonly depositService: DepositService,
    private readonly findAllDeposits: FindAllDepositsUseCase,
  ) {}

  @Post()
  async uploadDeposit(
    @Body() depositData: DepositDto,
  ): Promise<CommonResponse> {
    return {
      message: '성공적으로 입금내역이 추가되었습니다.',
      data: await this.depositService.uploadDeposit(depositData),
    };
  }

  @Get()
  async getAll(): Promise<CommonResponse> {
    return {
      data: await this.findAllDeposits.execute(new FindAllDepositsCommand()),
    };
  }
}
