import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Funding } from './funding.entity';
import { Image } from './image.entity';
import { IImageId } from 'src/interfaces/image-id.interface';
import { ImageType } from 'src/enums/image-type.enum';

@Entity()
export class Gift implements IImageId {
  get imgSubId(): number {
    return this.giftId;
  }

  get imageType(): ImageType {
    return ImageType.Gift;
  }

  @PrimaryGeneratedColumn()
  giftId: number;

  @ManyToOne(() => Funding, (funding) => funding.fundId)
  @JoinColumn({ name: 'fundId' })
  funding: Funding;

  @Column({ nullable: false })
  giftTitle: string;

  @Column()
  giftUrl: string;

  @Column()
  giftOrd: number;

  @Column({ nullable: true })
  giftOpt: string;

  @Column({ nullable: true, length: 20 })
  giftCont: string;

  @Column('int', { nullable: true })
  @ManyToOne(() => Image, (image) => image.imgId)
  @JoinColumn({ name: 'defaultImgId' })
  defaultImgId?: number;
}
