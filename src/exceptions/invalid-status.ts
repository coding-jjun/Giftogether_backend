import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from 'src/enums/error-code.enum';
import { ErrorMsg } from 'src/enums/error-message.enum';
import { GiftogetherException } from 'src/filters/giftogether-exception';

export class InvalidStatus extends GiftogetherException {
  constructor() {
    super(
      ErrorMsg.InvalidStatus,
      ErrorCode.InvalidStatus,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
