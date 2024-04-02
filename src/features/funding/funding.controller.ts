import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { FundingService } from './funding.service';
import { CreateFundingDto } from './dto/create-funding.dto';
import { UpdateFundingDto } from './dto/update-funding.dto';
import { Funding } from 'src/entities/funding.entity';
import { CommonResponse } from 'src/interfaces/common-response.interface';
import { FundTheme } from 'src/enums/fund-theme.enum';

@Controller('api/funding')
export class FundingController {
  constructor(private fundingService: FundingService) {}

  @Get()
  async findAll(
    @Query('fundPublFilter', new DefaultValuePipe('both')) fundPublFilter: 'all' | 'friends' | 'both',
    @Query('fundThemes', new DefaultValuePipe([FundTheme.Anniversary, FundTheme.Birthday, FundTheme.Donation])) fundThemes: FundTheme[],
    @Query('status', new DefaultValuePipe('ongoing')) status: 'ongoing' | 'ended',
    @Query('sort', new DefaultValuePipe('endAtDesc')) sort: 'endAtAsc' | 'endAtDesc' | 'regAtAsc' | 'regAtDesc',
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('lastFundId', new DefaultValuePipe(undefined), ParseIntPipe) lastFundId?: number,
    @Query('lastEndAt', new DefaultValuePipe(undefined)) lastEndAt?: string,
  ): Promise<CommonResponse> {
    try {
      const lastEndAtDate = lastEndAt ? new Date(lastEndAt) : undefined;
      const data = await this.fundingService.findAll(fundPublFilter, fundThemes, status, sort, limit, lastFundId, lastEndAtDate);

      return { timestamp: new Date(), message: 'Success', data };
    } catch (error) {
      throw new HttpException(
        'Failed to get fundings',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post()
  async create(@Body() fundingCreateDto: CreateFundingDto): Promise<CommonResponse> {
    const funding = await this.fundingService.create(fundingCreateDto, '');
    return {
      timestamp: new Date(Date.now()),
      message: '성공적으로 생성했습니다.',
      data: funding,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.fundingService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: number, fundingUpdateDto: UpdateFundingDto) {
    return await this.fundingService.update(id, fundingUpdateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.fundingService.remove(id);
  }
}
