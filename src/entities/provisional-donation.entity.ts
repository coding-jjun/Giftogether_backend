import { IsInt, Min } from 'class-validator';
import { Funding } from 'src/entities/funding.entity';
import { User } from 'src/entities/user.entity';
import { ProvisionalDonationStatus } from 'src/enums/provisional-donation-status.enum';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * 예비후원 엔티티입니다. 유저가 새 후원을 등록하면 이 인스턴스가 생성됩니다. 추후 입금(혹은 결제)
 * 내역이 확인되면 자동으로 Donation 인스턴스가 생성이 됩니다.
 */
@Entity()
export class ProvisionalDonation {
  @PrimaryGeneratedColumn()
  readonly provDonId: number;

  @Column('varchar', { unique: true })
  readonly senderSig: string; // '홍길동-1234'

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'senderUserId',
    referencedColumnName: 'userId',
  })
  readonly senderUser: User;

  @IsInt()
  @Min(0)
  @Column('int')
  readonly amount: number;

  @ManyToOne(
    () => Funding, //
    (funding) => funding.provDons, //
    {
      onDelete: 'SET NULL',
      nullable: true,
    },
  )
  @JoinColumn({
    name: 'fundId',
    referencedColumnName: 'fundId',
  })
  readonly funding: Funding;

  @Column('fundId')
  readonly fundId: number;

  @Column({
    type: 'enum',
    enum: ProvisionalDonationStatus,
    default: ProvisionalDonationStatus.Pending,
    name: 'status',
  })
  private _status: ProvisionalDonationStatus;

  public get status(): ProvisionalDonationStatus {
    return this._status;
  }

  @CreateDateColumn()
  regAt?: Date;

  @DeleteDateColumn()
  delAt?: Date;

  protected constructor(
    args: Partial<ProvisionalDonation>,
    status = ProvisionalDonationStatus.Pending,
  ) {
    Object.assign(this, args);
    this._status = status;
  }

  approve(g2gException: GiftogetherExceptions): void {
    if (this._status !== ProvisionalDonationStatus.Pending) {
      // [정책] 매칭이 Pending 상태인 경우에만 상태전이 가능합니다.
      throw g2gException.InvalidStatusChange;
    }
    this._status = ProvisionalDonationStatus.Approved;
  }

  reject(g2gException: GiftogetherExceptions): void {
    if (this._status !== ProvisionalDonationStatus.Pending) {
      // [정책] 매칭이 Pending 상태인 경우에만 상태전이 가능합니다.
      throw g2gException.InvalidStatusChange;
    }
    this._status = ProvisionalDonationStatus.Rejected;
  }

  pending(g2gException: GiftogetherExceptions): void {
    if (this._status !== ProvisionalDonationStatus.Approved) {
      // [정책] 매칭 성공 후 관리자 권한에 의해 다시 Pending 상태로 넘어가는 것만
      // 가능합니다.
      throw g2gException.InvalidStatusChange;
    }
    this._status = ProvisionalDonationStatus.Pending;
  }

  refund(g2gException: GiftogetherExceptions): void {
    if (this._status !== ProvisionalDonationStatus.Rejected) {
      // [정책] 매칭 취소 후 관리자가 환불처리한 경우에만 Refund 상태변화가 가능합니다.
      throw g2gException.InvalidStatusChange;
    }
    this._status = ProvisionalDonationStatus.Refunded;
  }

  static create(
    g2gException: GiftogetherExceptions,
    senderSig: string, // '홍길동-1234'
    senderUser: User, // User('홍길동')
    amount: number,
    funding: Funding,
  ) {
    if (amount > funding.fundGoal) {
      // [정책] 후원금액의 최대치는 펀딩금액을 넘지 못합니다.
      throw g2gException.DonationAmountExceeded;
    }

    return new ProvisionalDonation({
      senderSig,
      senderUser,
      amount,
      funding,
    });
  }
}
