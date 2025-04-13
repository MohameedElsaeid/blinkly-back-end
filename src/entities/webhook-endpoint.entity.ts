import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum WebhookEventType {
  LINK_CREATED = 'link.created',
  LINK_UPDATED = 'link.updated',
  LINK_DELETED = 'link.deleted',
  LINK_CLICKED = 'link.clicked',
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
}

@Entity('webhook_endpoints')
export class WebhookEndpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column('simple-array')
  events: WebhookEventType[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 255, unique: true })
  secret: string;

  @Column({ type: 'int', default: 0 })
  failedAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lastFailedAt: Date;

  @ManyToOne(() => User, (user) => user.webhookEndpoints)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
