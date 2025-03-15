import { Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CsBoardService } from './cs-board.service';
import { CreateCsBoardDto } from './dto/create-cs-board.dto';
import { CommonResponse } from 'src/interfaces/common-response.interface';
import { Request } from 'express';
import { User } from 'src/entities/user.entity';
import { UpdateCsBoardDto } from './dto/update-cs-board.dto';
import { CsType } from 'src/enums/cs-type.enum';
import { JwtExtendedAuthGuard } from '../auth/guard/jwt-extended-auth-guard';
@Controller('csboard')
export class CsBoardController {
  constructor(
    private readonly csService: CsBoardService
  ){}
  
  
  @Get(':csId')
  @UseGuards(JwtExtendedAuthGuard)
  async findOneCsBoard(
    @Req() req: Request,
    @Param('csId', ParseIntPipe) csId: number,
  ): Promise<CommonResponse>{
    
    const user = req.user as { user: User } as any;
    return {
      message: "CS 게시글 조회 완료",
      data: await this.csService.findOne(csId, user),
    }
  }

  @Get()
  async findAllCsBoard(
    @Query('csType', new DefaultValuePipe(undefined)) csType: CsType
  ): Promise<CommonResponse>{

    return {
      message: "CS 게시글 전체 조회 완료",
      data: await this.csService.findAllCsBoards(csType),
    }
  }
  @Post()
  @UseGuards(JwtExtendedAuthGuard)
  async createCsBoard(
    @Req() req: Request,
    @Body() createCsBoard: CreateCsBoardDto
  ): Promise<CommonResponse>{
    
    const user = req.user as { user: User } as any;
    return {
      message: "CS 게시글 생성 완료",
      data: await this.csService.create(createCsBoard, user),
    }
  }
  @Patch(':csId')
  @UseGuards(JwtExtendedAuthGuard)
  async updateCsBoard(
    @Req() req: Request,
    @Param('csId', ParseIntPipe) csId: number,
    @Body() updateCsBoard: UpdateCsBoardDto
  ): Promise<CommonResponse>{
    
    const user = req.user as { user: User } as any;
    return {
      message: "CS 게시글 수정 완료",
      data: await this.csService.update(csId, updateCsBoard, user.userId),
    }
  }

  @Delete(':csId')
  @UseGuards(JwtExtendedAuthGuard)
  async deleteCsBoard(
    @Req() req: Request,
    @Param('csId', ParseIntPipe) csId: number,
  ): Promise<CommonResponse>{
    const user = req.user as { user: User } as any;
    return {
      message: "CS 게시글 삭제 완료",
      data: await this.csService.delete(csId, user),
    }
  }

}
