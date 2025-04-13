import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DynamicLink } from './dynamic-link.entity';

@Entity('dynamic_link_click_events')
export class DynamicLinkClickEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Basic client connection details
  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  referrer: string;

  // Enhanced geolocation details
  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  state: string; // e.g., region/province

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true, type: 'decimal', precision: 9, scale: 6 })
  latitude: number;

  @Column({ nullable: true, type: 'decimal', precision: 9, scale: 6 })
  longitude: number;

  // Enhanced device and browser details
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

  // Session and marketing/tracking details
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

  @ManyToOne(() => DynamicLink, (dynamicLink) => dynamicLink.clickEvents)
  dynamicLink: DynamicLink;

  @CreateDateColumn()
  timestamp: Date;
}
