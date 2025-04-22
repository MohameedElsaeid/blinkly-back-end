import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Visit } from './visit.entity';

@Entity('user_devices')
@Unique(['userId', 'deviceId', 'xDeviceId'])
export class UserDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  @Index()
  userId?: string;

  @ManyToOne(() => User, (u) => u.userDevices, {
    onDelete: 'CASCADE',
    nullable: true,
    eager: false,
  })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'varchar' })
  @Index()
  deviceId: string;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  xDeviceId: string | null;

  @Column('int', { nullable: true })
  xDeviceMemory?: number | null;

  @Column('int', { nullable: true })
  xHardwareConcurrency?: number | null;

  @Column({ type: 'varchar', nullable: true })
  xPlatform?: string | null;

  @Column('int', { nullable: true })
  xScreenWidth?: number | null;

  @Column('int', { nullable: true })
  xScreenHeight?: number | null;

  @Column('int', { nullable: true })
  xColorDepth?: number | null;

  @Column({ type: 'varchar', nullable: true })
  xTimeZone?: string | null;

  @Column({ type: 'varchar', nullable: true })
  fingerprintHash?: string | null;

  @Column({ type: 'varchar', nullable: true })
  browser?: string;

  @Column({ type: 'varchar', nullable: true })
  deviceType?: string;

  @OneToMany(() => Visit, (v) => v.userDevice)
  visits: Visit[];

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
