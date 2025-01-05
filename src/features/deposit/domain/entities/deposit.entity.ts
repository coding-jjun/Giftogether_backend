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
import { EventName } from 'src/interfaces/transition.interface';
import { IFsmService } from 'src/interfaces/fsm-service.interface';
import { ITransitionDelegate } from './transition-delegate.interface';

/**
 * 이체내역을 관리하는 엔티티 입니다.
 */
@Entity()
export class Deposit implements ITransitionDelegate<DepositStatus> {
  @PrimaryGeneratedColumn()
  readonly depositId: number;

  /**
   * `Deposit ||--o| Donation` 관계에서 Deposit이 강성엔티티, Donation이 약성엔티티입니다.
   */
  @OneToOne(() => Donation, { nullable: true, onDelete: 'SET NULL' })
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

  public transition(
    event: EventName,
    fsmService: IFsmService<DepositStatus>,
  ): void {
    const newState = fsmService.transition(this.status, event);
    this._status = newState;
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
