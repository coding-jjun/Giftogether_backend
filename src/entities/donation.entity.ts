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
  Index,
} from 'typeorm';
import { IsInt, Max, Min } from 'class-validator';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { Deposit } from 'src/features/deposit/domain/entities/deposit.entity';
import { InconsistentAggregationError } from 'src/exceptions/inconsistent-aggregation';
import { truncateTime } from 'src/util/truncate-tiime';
import orderId from 'order-id';

@Entity()
export class Donation {
  @PrimaryGeneratedColumn()
  donId: number;

  @ManyToOne(() => Funding)
  @JoinColumn({ name: 'fundId', referencedColumnName: 'fundId' })
  readonly funding: Funding;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  readonly user: User;

  @OneToOne(() => Deposit, (deposit) => deposit.donation, { nullable: true })
  deposit: Deposit;

  @Column({
    type: 'enum',
    enum: DonationStatus,
    default: DonationStatus.Pending,
  })
  donStat: DonationStatus;

  public get status(): DonationStatus {
    return this.donStat;
  }

  @Column()
  orderId: string;

  @IsInt()
  @Min(10_000)
  @Max(5_000_000)
  @Column({ default: 10_000, name: 'donAmnt' })
  donAmnt: number;

  get amount(): number {
    return this.donAmnt;
  }

  set amount(value: number) {
    if (value < 10_000 || value > 5_000_000) {
      throw new InconsistentAggregationError();
    }
    this.donAmnt = value;
  }

  @CreateDateColumn()
  regAt: Date;

  @DeleteDateColumn()
  delAt: Date;

  @Column({ type: 'date', nullable: true })
  expirationDate: Date;

  @Column({ type: 'varchar', length: 10, nullable: false, unique: true })
  @Index('UQ-senderSig', { unique: true })
  senderSig: string;

  approve(g2gException: GiftogetherExceptions) {
    if (this.donStat !== DonationStatus.Pending) {
      // [정책] 매칭이 Pending인 상태인 경우에만 상태전이가 가능합니다.
      throw g2gException.InvalidStatusChange;
    }
    this.donStat = DonationStatus.Approved;
  }

  reject(g2gException: GiftogetherExceptions): void {
    if (this.donStat !== DonationStatus.Pending) {
      // [정책] 매칭이 Pending 상태인 경우에만 상태전이 가능합니다.
      throw g2gException.InvalidStatusChange;
    }
    this.donStat = DonationStatus.Rejected;
  }

  /**
   * !NOTE: 아직 WaitingRefund 상태에 대한 예외처리가 되어있지 않습니다.
   */
  refund(g2gException: GiftogetherExceptions) {
    if (
      [DonationStatus.Deleted, DonationStatus.RefundComplete].includes(
        this.donStat,
      )
    ) {
      throw g2gException.InvalidStatusChange;
    }
    this.donStat = DonationStatus.RefundComplete;
    this.delAt = new Date(Date.now()); // softDelete까지 수행함.
  }

  /**
   * 비록 fundSum이라는 프로퍼티로 엮여있지만, Donation과 Funding과는
   * 즉각적인 일관성이 필요하지 않습니다. 따라서, Donation 삭제시 일관적인
   * 상태인지만 확인하고 softDelete를 수행합니다.
   */
  delete() {
    if (
      [
        DonationStatus.WaitingRefund,
        DonationStatus.RefundComplete,
        DonationStatus.Deleted,
      ].includes(this.donStat)
    ) {
      throw new InconsistentAggregationError();
    }
    this.donStat = DonationStatus.Deleted;
    this.delAt = new Date(Date.now()); // softDelete까지 수행함.
  }

  private static calculateExpirationDate(): Date {
    const expiration = truncateTime(new Date());
    expiration.setDate(expiration.getDate() + 3);
    return expiration;
  }

  /**
   * 한 유저가 여러번 후원하는 경우 예비후원과 이체내역을 찾을 수 없는 문제 때문에
   * '보내는 분'에 고유식별번호를 추가하기로 했습니다.
   *
   * [노션 문서](https://www.notion.so/c3cd436359344df6b60bfaed9bdbf784?pvs=4) 참고
   * @param username 입금자명
   */
  private static generateSenderSig(username: string): string {
    const signature: string = Math.round(Math.random() * 100).toString();
    const delimeter = '-';
    return username + delimeter + signature;
  }

  protected constructor(args: Partial<Donation>) {
    Object.assign(this, args);
  }

  static create(
    fundId: number,
    fundGoal: number,
    userId: number,
    userName: string,
    amount: number,
    g2gException: GiftogetherExceptions,
  ): Donation {
    if (amount > fundGoal) {
      // [정책] 후원금액의 최대치는 펀딩금액을 넘지 못합니다.
      throw g2gException.DonationAmountExceeded;
    }

    return new Donation({
      funding: { fundId } as Funding,
      user: { userId } as User,
      amount: amount,
      donStat: DonationStatus.Pending,
      orderId: orderId('key').generate(),
      senderSig: this.generateSenderSig(userName),
      expirationDate: this.calculateExpirationDate(),
    });

    // TODO - Add RollingPaper for inner object
  }
}
