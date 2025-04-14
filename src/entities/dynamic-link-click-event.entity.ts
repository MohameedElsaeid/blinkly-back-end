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

  // Cloudflare headers
  @Column({ nullable: true })
  cfRay: string;

  @Column({ nullable: true })
  cfVisitor: string;

  @Column({ nullable: true })
  cfDeviceType: string;

  @Column({ nullable: true })
  cfMetroCode: string;

  @Column({ nullable: true })
  cfRegion: string;

  @Column({ nullable: true })
  cfRegionCode: string;

  @Column({ nullable: true })
  cfConnectingIp: string;

  @Column({ nullable: true })
  cfIpCity: string;

  @Column({ nullable: true })
  cfIpContinent: string;

  @Column({ nullable: true })
  cfIpLatitude: string;

  @Column({ nullable: true })
  cfIpLongitude: string;

  @Column({ nullable: true })
  cfIpTimeZone: string;

  @ManyToOne(() => DynamicLink, (dynamicLink) => dynamicLink.clickEvents)
  dynamicLink: DynamicLink;

  @CreateDateColumn()
  timestamp: Date;
}
