import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Link } from './link.entity';

@Entity('click_events')
export class ClickEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  referrer: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true, type: 'decimal', precision: 9, scale: 6 })
  latitude: number;

  @Column({ nullable: true, type: 'decimal', precision: 9, scale: 6 })
  longitude: number;

  @Column({ nullable: true })
  operatingSystem: string;

  @Column({ nullable: true })
  osVersion: string;

  @Column({ nullable: true })
  browserName: string;

  @Column({ nullable: true })
  browserVersion: string;

  @Column({ nullable: true })
  deviceModel: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ nullable: true })
  utmSource: string;

  @Column({ nullable: true })
  utmMedium: string;

  @Column({ nullable: true })
  utmCampaign: string;

  @Column({ nullable: true })
  utmTerm: string;

  @Column({ nullable: true })
  utmContent: string;

  @ManyToOne(() => Link, (link) => link.clickEvents)
  link: Link;

  @CreateDateColumn()
  timestamp: Date;
}
