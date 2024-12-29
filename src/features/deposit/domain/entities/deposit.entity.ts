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
import { InconsistentAggregationError } from 'src/exceptions/inconsistent-aggregation';

/**
 * 이체내역을 관리하는 엔티티 입니다.
 */
@Entity()
export class Deposit {
  @PrimaryGeneratedColumn()
  readonly depositId: number;

  /**
   * `Deposit 0..1 --> 1 Donation` 관계에서 Donation이 강성엔티티, Deposit이 약성엔티티입니다.
   */
  @OneToOne(() => Donation, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'donationId' }) // FK를 참조하는 쪽만 @JoinColumn을 가져야 함
  readonly donation?: Donation;

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
    if (
      this._status in
      [
        DepositStatus.Unmatched, //
        DepositStatus.Refunded, //
        DepositStatus.Deleted,
      ]
    ) {
      throw g2gException.InvalidStatusChange;
    }
    if (this._status === DepositStatus.Matched) {
      // Donation이 존재하는 상황!
      if (!this.donation) {
        throw new InconsistentAggregationError();
      }
      this.donation.refund(g2gException);
    }
    this._status = DepositStatus.Refunded;
  }

  /**
   * Donation 엔티티와의 즉각적인 일관성이 필요합니다. Funding과는 느슨한 일관성을
   * 유지해도 될 것 같습니다.
   */
  delete() {
    if (this._status === DepositStatus.Matched) {
      if (!this.donation) {
        throw new InconsistentAggregationError();
      }
      // Deposit 없는 Donation은 존재하지 않기 때문에 Donation을 먼저 제거.
      this.donation.delete();
    }
    this._status = DepositStatus.Deleted;
    this.delAt = new Date(Date.now()); // softDelete까지 시켜버림
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
    depositId?: number,
  ): Deposit {
    return new Deposit({
      senderSig,
      receiver,
      amount,
      transferDate,
      depositBank,
      depositAccount,
      withdrawalAccount,
      depositId,
    });
  }
}
