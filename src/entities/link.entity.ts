import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ClickEvent } from './click-event.entity';
import { QrCode } from './qr-code.entity';

export enum RedirectType {
  PERMANENT = 301,
  TEMPORARY = 302,
}

@Entity('links')
export class Link {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalUrl: string;

  @Column({ unique: true })
  @Index()
  alias: string;

  @Column({ default: true })
  @Index()
  isActive: boolean;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ type: 'int', default: 0 })
  clickCount: number;

  @Column({ type: 'enum', enum: RedirectType, default: RedirectType.TEMPORARY })
  redirectType: RedirectType;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  expiresAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaTitle: string | null;

  @Column({ type: 'text', nullable: true })
  metaDescription: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaImage: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToOne(() => User, (user) => user.links)
  @Index()
  user: User;

  @OneToMany(() => ClickEvent, (clickEvent) => clickEvent.link)
  clickEvents: ClickEvent[];

  @OneToMany(() => QrCode, (qrCode) => qrCode.link)
  qrCodes: QrCode[];

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
