import { Image } from 'src/entities/image.entity';
import { EntitySubscriberInterface, EventSubscriber } from 'typeorm';

/**
 * 모든 Image 쿼리의 실행횟수를 검사합니다.
 */
@EventSubscriber()
export class ImageQuerySubscriber implements EntitySubscriberInterface<Image> {
  private _queryCount = 0;

  public get queryCount() {
    return this._queryCount;
  }

  listenTo() {
    return Image;
  }

  beforeQuery() {
    console.log(`Executed SQL Queries: ${this.queryCount}`);
    this._queryCount++;
  }
}
