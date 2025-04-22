import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Plan } from './plan.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('user_subscriptions')
@Unique(['user', 'plan', 'status'])
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, (user) => user.subscriptions, { onDelete: 'CASCADE' })
  user: User;

  // The subscription references one plan
  @ManyToOne(() => Plan, (plan) => plan.subscriptions, { eager: true })
  plan: Plan;

  @Column({ type: 'timestamp with time zone' })
  startDate: Date;

  // End date can be null if subscription is ongoing (or recurring)
  @Column({ type: 'timestamp with time zone', nullable: true })
  endDate: Date | null;

  @Index()
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIAL,
  })
  status: SubscriptionStatus;

  @Column({ type: 'boolean', default: false })
  autoRenew: boolean;

  // Stripe-specific fields
  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeSubscriptionId: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string; // e.g. 'stripe', 'admin', 'gift'

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeCustomerId: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
