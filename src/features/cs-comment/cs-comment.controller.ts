import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CsCommentService } from './cs-comment.service';
import { CsCommentDto } from './dto/cs-comment.dto';
import { CommonResponse } from 'src/interfaces/common-response.interface';
import { Request } from 'express';
import { User } from 'src/entities/user.entity';
import { JwtExtendedAuthGuard } from '../auth/guard/jwt-extended-auth-guard';
import { CsCommentReqeustDto } from './dto/cs-comment-request.dto';

@Controller('cscomment')
export class CsCommentController {
  constructor(
    private readonly csComService: CsCommentService
  ){}

  @Post(':csId')
  @UseGuards(JwtExtendedAuthGuard)
  async createCsBoard(
    @Req() req: Request,
    @Param('csId', ParseIntPipe) csId: number,
    @Body() createCsComment: CsCommentReqeustDto
  ): Promise<CommonResponse>{
    
    const user = req.user as { user: User } as any;
    return {
      message: "CS 댓글 생성 완료",
      data: await this.csComService.create(csId, createCsComment, user),
    }
  }

  @Patch(':cscomId')
  @UseGuards(JwtExtendedAuthGuard)
  async updateCsBoard(
    @Req() req: Request,
    @Param('cscomId', ParseIntPipe) cscomId: number,
    @Body() updateCsComment: CsCommentReqeustDto
  ): Promise<CommonResponse>{
    
    const user = req.user as { user: User } as any;
    return {
      message: "CS 댓글 수정 완료",
      data: await this.csComService.update(cscomId, updateCsComment, user.userId),
    }
  }

  @Delete(':cscomId')
  @UseGuards(JwtExtendedAuthGuard)
  async deleteCsBoard(
    @Req() req: Request,
    @Param('cscomId', ParseIntPipe) cscomId: number,
  ): Promise<CommonResponse>{
    const user = req.user as { user: User } as any;

    return {
      message: "CS 댓글 삭제 완료",
      data: await this.csComService.delete(cscomId, user.userId),
    }
  }

}
