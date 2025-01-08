import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CsCommentService } from './cs-comment.service';
import { CsCommentDto } from './dto/cs-comment.dto';
import { CommonResponse } from 'src/interfaces/common-response.interface';
import { JwtAuthGuard } from '../auth/guard/jwt-auth-guard';
import { Request } from 'express';
import { User } from 'src/entities/user.entity';

@Controller('cscomment')
export class CsCommentController {
  constructor(
    private readonly csComService: CsCommentService
  ){}

  @Post(':csId')
  @UseGuards(JwtAuthGuard)
  async createCsBoard(
    @Req() req: Request,
    @Param('csId', ParseIntPipe) csId: number,
    @Body() createCsComment: CsCommentDto
  ): Promise<CommonResponse>{
    
    const user = req.user as { user: User } as any;
    return {
      message: "CS 댓글 생성 완료",
      data: await this.csComService.create(csId, createCsComment, user.userId),
    }
  }

  @Patch(':cscomId')
  @UseGuards(JwtAuthGuard)
  async updateCsBoard(
    @Req() req: Request,
    @Param('cscomId', ParseIntPipe) cscomId: number,
    @Body() updateCsComment: CsCommentDto
  ): Promise<CommonResponse>{
    
    const user = req.user as { user: User } as any;
    return {
      message: "CS 댓글 수정 완료",
      data: await this.csComService.update(cscomId, updateCsComment, user.userId),
    }
  }

  @Delete(':cscomId')
  async deleteCsBoard(
    @Param('cscomId', ParseIntPipe) cscomId: number,
  ): Promise<CommonResponse>{
    return {
      message: "CS 댓글 삭제 완료",
      data: await this.csComService.delete(cscomId),
    }
  }

}
