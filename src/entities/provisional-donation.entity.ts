import { IsInt, Min } from 'class-validator';
import { Funding } from 'src/entities/funding.entity';
import { User } from 'src/entities/user.entity';
import { ProvisionalDonationStatus } from 'src/enums/provisional-donation-status.enum';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { IFsmService } from 'src/interfaces/fsm-service.interface';
import { ITransitionDelegate } from 'src/interfaces/transition-delegate.interface';
import { EventName } from 'src/interfaces/transition.interface';
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
export class ProvisionalDonation
  implements ITransitionDelegate<ProvisionalDonationStatus>
{
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

  transition(
    event: EventName,
    fsmService: IFsmService<ProvisionalDonationStatus>,
  ): void {
    const newState = fsmService.transition(this._status, event);
    this._status = newState;
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
