import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DepositStatus } from '../../../../enums/deposit-status.enum';
import { IsInt, Min } from 'class-validator';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { Donation } from 'src/entities/donation.entity';

/**
 * 이체내역을 관리하는 엔티티 입니다.
 */
@Entity()
export class Deposit {
  @PrimaryGeneratedColumn()
  readonly depositId: number;

  @OneToOne(() => Donation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'donationId' })
  donation?: Donation;

  @Column('varchar')
  readonly senderSig: string; // 보내는분, '홍길동-1234'

  @Column('varchar')
  readonly receiver: string; // 받는분

  @IsInt()
  @Min(0)
  @Column('int')
  readonly amount: number;

  @Column('date')
  readonly transferDate: Date;

  @Column('varchar')
  readonly depositBank: string; // 이체은행

  @Column('varchar')
  readonly depositAccount: string; // 이체계좌번호

  @Column('varchar')
  readonly withdrawalAccount: string; // 환불계좌번호

  @Column({
    type: 'enum',
    enum: DepositStatus,
    name: 'status',
  })
  private _status: DepositStatus;

  public get status(): DepositStatus {
    return this._status;
  }

  orphan(g2gException: GiftogetherExceptions) {
    if (this._status !== DepositStatus.Unmatched) {
      throw g2gException.InvalidStatusChange;
    }
    this._status = DepositStatus.Orphan;
  }

  matched(g2gException: GiftogetherExceptions) {
    if (this._status !== DepositStatus.Unmatched) {
      throw g2gException.InvalidStatusChange;
    }
    this._status = DepositStatus.Matched;
  }

  refund(g2gException: GiftogetherExceptions) {
    if (this._status !== DepositStatus.Unmatched) {
      throw g2gException.InvalidStatusChange;
    }
    this._status = DepositStatus.Refunded;
  }

  @CreateDateColumn()
  regAt?: Date;

  @DeleteDateColumn()
  delAt?: Date;

  protected constructor(
    args: Partial<Deposit>,
    status = DepositStatus.Unmatched,
  ) {
    Object.assign(this, args);
    this._status = status;
  }

  static create(
    senderSig: string,
    receiver: string,
    amount: number,
    transferDate: Date,
    depositBank: string,
    depositAccount: string,
    withdrawalAccount: string,
  ): Deposit {
    return new Deposit({
      senderSig,
      receiver,
      amount,
      transferDate,
      depositBank,
      depositAccount,
      withdrawalAccount,
    });
  }
}
