import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Link } from './link.entity';
import { User } from './user.entity';

@Entity('qr_codes')
export class QrCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  targetUrl: string;

  @ManyToOne(() => Link, (link) => link.qrCodes, { nullable: true })
  @Index('idx_qrcode_link')
  link: Link;

  @ManyToOne(() => User, (user) => user.qrCodes)
  @Index('idx_qrcode_user')
  user: User;

  @Column({ type: 'int', default: 300 })
  size: number;

  @Column({ type: 'varchar', length: 7, default: '#000000' })
  color: string;

  @Column({ type: 'varchar', length: 7, default: '#FFFFFF' })
  backgroundColor: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logoUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'int', default: 0 })
  scanCount: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
