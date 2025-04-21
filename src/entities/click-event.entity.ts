import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { UserDevice } from './user-device.entity';
import { Link } from './link.entity';

@Entity('click_events')
export class ClickEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamptz', nullable: true })
  timestamp: Date | null;

  @Column('uuid', { nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column('uuid', { nullable: true })
  userDeviceId?: string | null;

  @ManyToOne(() => UserDevice, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userDeviceId' })
  userDevice?: UserDevice | null;

  @Column('uuid')
  linkId: string;

  @ManyToOne(() => Link, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'linkId' })
  link: Link;

  @Column({ type: 'varchar', nullable: true }) host: string | null;
  @Column({ type: 'varchar', nullable: true }) cfRay: string | null;
  @Column({ type: 'timestamptz', nullable: true }) requestTime: Date | null;
  @Column({ type: 'int', nullable: true }) xDeviceMemory: number | null;
  @Column({ type: 'varchar', nullable: true }) requestId: string | null;
  @Column({ type: 'varchar', nullable: true }) acceptEncoding: string | null;
  @Column({ type: 'varchar', nullable: true }) xPlatform: string | null;
  @Column({ type: 'varchar', nullable: true }) xForwardedProto: string | null;
  @Column({ type: 'varchar', nullable: true }) xLanguage: string | null;
  @Column({ type: 'varchar', nullable: true }) cfVisitorScheme: string | null;
  @Column({ type: 'varchar', nullable: true }) cfIpCountry: string | null;
  @Column({ type: 'varchar', nullable: true }) geoCountry: string | null;
  @Column({ type: 'varchar', nullable: true }) geoCity: string | null;
  @Column('decimal', { precision: 9, scale: 6, nullable: true }) geoLatitude:
    | number
    | null;
  @Column('decimal', { precision: 9, scale: 6, nullable: true }) geoLongitude:
    | number
    | null;
  @Column({ type: 'varchar', nullable: true }) xFbClickId: string | null;
  @Column({ type: 'varchar', nullable: true }) xFbBrowserId: string | null;
  @Column({ type: 'varchar', nullable: true }) cfConnectingO2O: string | null;
  @Column('int', { nullable: true }) contentLength: number | null;
  @Column({ type: 'varchar', nullable: true }) xForwardedFor: string | null;
  @Column({ type: 'varchar', nullable: true }) xXsrfToken: string | null;
  @Column({ type: 'varchar', nullable: true }) xUserAgent: string | null;
  @Column({ type: 'varchar', nullable: true }) xTimeZone: string | null;
  @Column('int', { nullable: true }) xScreenWidth: number | null;
  @Column('int', { nullable: true }) xScreenHeight: number | null;
  @Column({ type: 'varchar', nullable: true }) xRequestedWith: string | null;
  @Column({ type: 'varchar', nullable: true }) contentType: string | null;
  @Column({ type: 'varchar', nullable: true }) cfEwVia: string | null;
  @Column({ type: 'varchar', nullable: true }) cdnLoop: string | null;
  @Column({ type: 'varchar', nullable: true }) acceptLanguage: string | null;
  @Column({ type: 'varchar', nullable: true }) accept: string | null;
  @Column({ type: 'varchar', nullable: true }) cacheControl: string | null;
  @Column({ type: 'varchar', nullable: true }) referer: string | null;
  @Column({ type: 'varchar', nullable: true }) userAgent: string | null;
  @Column({ type: 'varchar', nullable: true }) cfConnectingIp: string | null;
  @Column({ type: 'varchar', nullable: true }) deviceId: string | null;
  @Column({ type: 'varchar', nullable: true }) dnt: string | null;
  @Column({ type: 'varchar', nullable: true }) origin: string | null;
  @Column({ type: 'varchar', nullable: true }) priority: string | null;
  @Column({ type: 'varchar', nullable: true }) secChUa: string | null;
  @Column({ type: 'varchar', nullable: true }) secChUaMobile: string | null;
  @Column({ type: 'varchar', nullable: true }) secChUaPlatform: string | null;
  @Column({ type: 'varchar', nullable: true }) secFetchDest: string | null;
  @Column({ type: 'varchar', nullable: true }) secFetchMode: string | null;
  @Column({ type: 'varchar', nullable: true }) secFetchSite: string | null;
  @Column({ type: 'varchar', nullable: true }) xClientFeatures: string | null;
  @Column('int', { nullable: true }) xColorDepth: number | null;
  @Column({ type: 'varchar', nullable: true }) xCsrfToken: string | null;
  @Column({ type: 'varchar', nullable: true }) xCustomHeader: string | null;
  @Column({ type: 'varchar', nullable: true }) xDeviceId: string | null;
  @Column({ type: 'varchar', nullable: true }) doConnectingIp: string | null;
  @Column({ type: 'varchar', nullable: true }) browser: string | null;
  @Column({ type: 'varchar', nullable: true }) browserVersion: string | null;
  @Column({ type: 'varchar', nullable: true }) os: string | null;
  @Column({ type: 'varchar', nullable: true }) osVersion: string | null;
  @Column({ type: 'varchar', nullable: true }) device: string | null;
  @Column({ type: 'varchar', nullable: true }) deviceType: string | null;
  @Column({ type: 'jsonb', nullable: true }) queryParams: Record<
    string,
    any
  > | null;
}
