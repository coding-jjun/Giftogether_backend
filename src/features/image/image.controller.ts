import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  ParseFilePipe,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CommonResponse } from 'src/interfaces/common-response.interface';
import { ImageDto } from './dto/image.dto';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { JwtAuthGuard } from '../auth/guard/jwt-auth-guard';
import { UrlDto } from './dto/url.dto';
import { S3Service } from './s3.service';
import { Request } from 'express';
import { User } from 'src/entities/user.entity';
import { ImageService } from './image.service';
import { Image } from 'src/entities/image.entity';

@Controller('image')
export class ImageController {
  constructor(
    private readonly s3Service: S3Service,
    private readonly imgService: ImageService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  @UseGuards(JwtAuthGuard)
  async uploadFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
      }),
    )
    files: Express.Multer.File[],
    @Req() req: Request,
  ): Promise<CommonResponse> {
    const user = req.user as User;
    const uploadedImages = new ImageDto();
    const uploadPromises = files.map(async (file): Promise<string> => {
      const buffer = await sharp(file.buffer).resize(300).toBuffer();

      const regex = /\.([0-9a-z]+)(?:[\?#]|$)/i;
      const match = file.originalname.match(regex);
      const extension = match[1];

      const filename = uuidv4() + '.' + extension;

      const url = this.s3Service.upload(filename, buffer);
      return url;
    });
    const urls = await Promise.all(uploadPromises);

    uploadedImages.urls = urls;

    // DB에 임시 인스턴스를 저장
    const savePromises = urls.map(async (url): Promise<void> => {
      this.imgService.save(url, user);
    });
    await Promise.all(savePromises);

    return {
      message: '성공적으로 파일이 업로드 되었습니다.',
      data: uploadedImages,
    };
  }

  /**
   * 파일 URL로부터 파일명을 추출한 다음
   * 데이터베이스에 저장이 되어있는지 확인한 후
   * S3에 저장된 파일을 포함하여 제거합니다.
   * @authorization JWT Bearer Token
   * @param imgUrl 제거하고자 하는 이미지의 파일 URL
   * @todo 자신이 올린 이미지를 제외한 파일은 제거하지 못하도록 정책을 추가해야 합니다.
   */
  @Delete()
  @UseGuards(JwtAuthGuard)
  async deleteFile(
    @Req() req: Request,
    @Body() urlDto: UrlDto,
  ): Promise<CommonResponse> {
    const user = req.user as { user: User } as any;
    const { url } = urlDto;

    await this.imgService.deleteByUrlAndUser(url, user);

    await this.s3Service.delete(url);

    return {
      message: '성공적으로 파일이 삭제되었습니다.',
      data: null,
    };
  }
}
