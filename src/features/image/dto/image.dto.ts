import { Validate } from 'class-validator';
import { CustomUrlValidator } from 'src/util/custom-url-validator';

export class ImageDto {
  @Validate(CustomUrlValidator)
  urls: string[];
}
