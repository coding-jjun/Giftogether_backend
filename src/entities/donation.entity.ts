import { DonationStatus } from 'src/enums/donation-status.enum';
import { Funding } from 'src/entities/funding.entity';
import { User } from 'src/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  OneToOne,
} from 'typeorm';
import { IsInt, Min } from 'class-validator';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { Deposit } from 'src/entities/deposit.entity';
import { ITransitionDelegate } from '../interfaces/transition-delegate.interface';
import { IFsmService } from '../interfaces/fsm-service.interface';
import { EventName } from '../interfaces/transition.interface';

@Entity()
export class Donation implements ITransitionDelegate<DonationStatus> {
  @PrimaryGeneratedColumn()
  donId: number;

  @ManyToOne(() => Funding)
  @JoinColumn({ name: 'fundId', referencedColumnName: 'fundId' })
  funding: Funding;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  user: User;

  @Column()
  userId: number;

  @OneToOne(() => Deposit, (deposit) => deposit.donation, {
    nullable: false, // Donation은 있는데 Deposit이 없는 케이스는 존재하지 않습니다.,
  })
  @JoinColumn({ name: 'depositId' }) // FK를 참조하는 쪽만 @JoinColumn을 가져야 함
  deposit: Deposit;

  @Column({
    type: 'enum',
    enum: DonationStatus,
    default: DonationStatus.Donated,
  })
  donStat: DonationStatus;

  @Column()
  orderId: string;

  @IsInt()
  @Min(0)
  @Column({ default: 0 })
  donAmnt: number;

  @CreateDateColumn()
  regAt: Date;

  @DeleteDateColumn()
  delAt: Date;

  transition(event: EventName, fsmService: IFsmService<DonationStatus>): void {
    this.donStat = fsmService.transition(this.donStat, event);
  }

  private constructor(
    funding: Funding,
    senderUser: User,
    deposit: Deposit,
    amount: number,
  ) {
    this.funding = funding;
    this.user = senderUser;
    this.deposit = deposit;
    this.donAmnt = amount;
    this.donStat = DonationStatus.Donated;
    this.orderId = require('order-id')('key').generate();
  }

  static create(
    funding: Funding,
    senderUser: User,
    deposit: Deposit,
    amount: number,
    g2gException: GiftogetherExceptions,
  ) {
    if (amount > funding.fundGoal) {
      // [정책] 후원금액의 최대치는 펀딩금액을 넘지 못합니다.
      throw g2gException.DonationAmountExceeded;
    }

    // TODO - Add RollingPaper for inner object
    return new Donation(funding, senderUser, deposit, amount);
  }
}
