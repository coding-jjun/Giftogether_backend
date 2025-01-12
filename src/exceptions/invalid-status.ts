import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from 'src/enums/error-code.enum';
import { ErrorMsg } from 'src/enums/error-message.enum';
import { GiftogetherException } from 'src/filters/giftogether-exception';

export class InvalidStatus extends GiftogetherException {
  constructor(
    public readonly currentState?: string,
    public readonly event?: string,
  ) {
    super(
      ErrorMsg.InvalidStatus +
        (currentState ? ` from ${currentState}` : '') +
        (event ? ` by ${event}` : ''),
      ErrorCode.InvalidStatus,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
