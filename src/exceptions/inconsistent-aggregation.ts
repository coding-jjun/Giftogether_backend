import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from 'src/enums/error-code.enum';
import { ErrorMsg } from 'src/enums/error-message.enum';
import { GiftogetherException } from 'src/filters/giftogether-exception';

export class InconsistentAggregationError extends GiftogetherException {
  constructor() {
    super(
      ErrorMsg.InconsistentAggregationError,
      ErrorCode.InconsistentAggregationError,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
