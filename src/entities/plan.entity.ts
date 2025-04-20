import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { UserSubscription } from './user-subscription.entity';

export enum BillingFrequency {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum PlanName {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}

@Unique(['name', 'billingFrequency'])
@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: PlanName })
  name: PlanName;

  @Column({ type: 'enum', enum: BillingFrequency })
  billingFrequency: BillingFrequency;

  @Column({ type: 'int', nullable: true })
  price: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  features: string;

  @Column({ type: 'int', nullable: true })
  shortenedLinksLimit: number | null;

  @Column({ type: 'int', nullable: true })
  qrCodesLimit: number | null;

  @Column({ type: 'boolean', default: false })
  freeTrialAvailable: boolean;

  @Column({ type: 'int', nullable: true })
  freeTrialDays: number | null;

  @Column({ type: 'boolean', default: false })
  isMostPopular: boolean;

  @OneToMany(() => UserSubscription, (subscription) => subscription.plan)
  subscriptions: UserSubscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
