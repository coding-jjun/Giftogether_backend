import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  Generated,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Comment } from './comment.entity';
import { FundTheme } from 'src/enums/fund-theme.enum';
import { Gift } from './gift.entity';
import { Donation } from './donation.entity';
import { Image } from './image.entity';
import { IImageId } from 'src/interfaces/image-id.interface';
import { ImageType } from 'src/enums/image-type.enum';

@Entity()
export class Funding implements IImageId {
  constructor(
    fundUser: User,
    fundTitle: string,
    fundCont: string,
    fundGoal: number,
    endAt: Date,
    fundTheme: FundTheme,
    fundAddrRoad: string,
    fundAddrDetl: string,
    fundAddrZip: string,
    fundRecvName: string,
    fundRecvPhone: string,
    fundRecvReq?: string,
    fundPubl?: boolean,
  ) {
    this.fundUser = fundUser;
    this.fundTitle = fundTitle;
    this.fundCont = fundCont;
    this.fundGoal = fundGoal;
    this.endAt = endAt;
    this.fundTheme = fundTheme;
    this.fundPubl = fundPubl;
    this.fundAddrRoad = fundAddrRoad;
    this.fundAddrDetl = fundAddrDetl;
    this.fundAddrZip = fundAddrZip;
    this.fundRecvName = fundRecvName;
    this.fundRecvPhone = fundRecvPhone;
    this.fundRecvReq = fundRecvReq;
  }
  get imgSubId(): number {
    return this.fundId;
  }
  get imageType(): ImageType {
    return ImageType.Funding;
  }

  @PrimaryGeneratedColumn()
  fundId: number;

  @Index()
  @Column()
  @Generated('uuid')
  fundUuid: string;

  @ManyToOne(() => User, (user) => user.fundings)
  @JoinColumn({ name: 'fundUser' })
  fundUser: User;

  @Column('varchar')
  fundTitle: string;

  @Column('varchar')
  fundCont: string;

  @Column({
    type: 'enum',
    enum: FundTheme,
    default: FundTheme.Birthday,
  })
  fundTheme: FundTheme;

  @Column('boolean', { default: true })
  fundPubl: boolean;

  @Column('int')
  fundGoal: number;

  @Column('int', { default: 0 })
  fundSum: number;

  @Column()
  fundAddrRoad: string;

  @Column()
  fundAddrDetl: string;

  @Column()
  fundAddrZip: string;

  @Column()
  fundRecvName: string;

  @Column()
  fundRecvPhone: string;

  @Column({ nullable: true })
  fundRecvReq: string;

  @Column('date')
  // @Column('timestamptz')
  endAt: Date;

  @CreateDateColumn()
  regAt: Date;

  @UpdateDateColumn()
  uptAt: Date;

  @OneToMany(() => Comment, (comment) => comment.funding)
  comments: Comment[];

  @OneToMany(() => Gift, (gift) => gift.funding)
  gifts: Gift[];

  @OneToMany(() => Donation, (donation) => donation.funding, {
    cascade: true,
  })
  donations: Donation[];

  /**
   * defaultImgId가 null인 경우, Image.subId로 이미지를 가져올 수 있습니다.
   */
  @Column('int', { nullable: true })
  @ManyToOne(() => Image, (image) => image.imgId)
  @JoinColumn({ name: 'defaultImgId' })
  defaultImgId?: number;

  @OneToOne(() => Image, (image) => image.subId)
  image: Image;
}
