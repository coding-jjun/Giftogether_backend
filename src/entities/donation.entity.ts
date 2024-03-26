import { DonationStatus } from 'src/enums/donation-status.enum';
import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity()
export class Donation {
  @PrimaryGeneratedColumn()
  donId: number;

  // @ManyToOne(() => Fund)
  // @JoinColumn({ name: 'fundId', referencedColumnName: 'fundId' })
  // funding: Funding;

  // @ManyToOne(() => User)
  // @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  // user: User;

  @Column({
    type: 'enum',
    enum: DonationStatus,
    default: DonationStatus.Donated,
  })
  donationStatus: DonationStatus;

  @Column()
  orderId: string;

  @Column({ default: 0 })
  donAmnt: number;

  @CreateDateColumn()
  regAt: Date;

  @DeleteDateColumn()
  delAt: Date;
}
