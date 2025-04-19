import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Visit } from './visit.entity';

@Entity('user_devices')
export class UserDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  userId?: string;

  @ManyToOne(() => User, (u) => u.userDevices, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'varchar' }) deviceId: string;
  @Column({ type: 'varchar' }) xDeviceId: string;
  @Column('int', { nullable: true }) xDeviceMemory?: number | null;
  @Column('int', { nullable: true }) xHardwareConcurrency?: number | null;
  @Column({ type: 'varchar', nullable: true }) xPlatform?: string | null;
  @Column('int', { nullable: true }) xScreenWidth?: number | null;
  @Column('int', { nullable: true }) xScreenHeight?: number | null;
  @Column('int', { nullable: true }) xColorDepth?: number | null;
  @Column({ type: 'varchar', nullable: true }) xTimeZone?: string | null;

  @OneToMany(() => Visit, (v) => v.userDevice)
  visits: Visit[];
}
