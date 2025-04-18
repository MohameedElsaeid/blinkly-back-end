import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('visitors')
export class Visitor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  deviceId: string;

  @Column({ nullable: true })
  fingerprint: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  acceptEncoding: string;

  @Column({ nullable: true })
  acceptLanguage: string;

  @Column({ nullable: true })
  cdLoop: string;

  @Column({ nullable: true })
  cfConnectingIp: string;

  @Column({ nullable: true })
  cfCountry: string;

  @Column({ nullable: true })
  cfRay: string;

  @Column({ nullable: true })
  cfVisitor: string;

  @Column({ nullable: true })
  contentType: string;

  @Column({ nullable: true })
  dnt: string;

  @Column({ nullable: true })
  host: string;

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  origin: string;

  @Column({ nullable: true })
  priority: string;

  @Column({ nullable: true })
  referer: string;

  @Column({ nullable: true })
  requestId: string;

  @Column({ nullable: true })
  secChUa: string;

  @Column({ nullable: true })
  secChUaMobile: string;

  @Column({ nullable: true })
  secChUaPlatform: string;

  @Column({ nullable: true })
  secFetchDest: string;

  @Column({ nullable: true })
  secFetchMode: string;

  @Column({ nullable: true })
  secFetchSite: string;

  @Column({ nullable: true })
  colorDepth: string;

  @Column({ nullable: true })
  deviceMemory: string;

  @Column({ nullable: true })
  hardwareConcurrency: string;

  @Column({ nullable: true })
  platform: string;

  @Column({ nullable: true })
  screenHeight: string;

  @Column({ nullable: true })
  screenWidth: string;

  @Column({ nullable: true })
  timeZone: string;

  @Column({ nullable: true })
  browser: string;

  @Column({ nullable: true })
  browserVersion: string;

  @Column({ nullable: true })
  os: string;

  @Column({ nullable: true })
  osVersion: string;

  @Column({ nullable: true })
  device: string;

  @Column({ nullable: true })
  deviceType: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  city: string;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  longitude: number;

  @Column({ default: 1 })
  visitCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastVisit: Date;

  @Column({ nullable: true })
  userId: string;

  @JoinColumn({ name: 'userId' })
  @ManyToOne(() => User, (user) => user.visitors)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
