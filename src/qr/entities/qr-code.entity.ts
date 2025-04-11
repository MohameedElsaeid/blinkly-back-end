import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Link } from '../../entities/link.entity';
import { User } from '../../entities/user.entity';

@Entity('qr_codes')
export class QrCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  targetUrl: string;

  @ManyToOne(() => Link, (link) => link.qrCodes, { nullable: true })
  link: Link;

  @ManyToOne(() => User, (user) => user.qrCodes)
  user: User;

  @Column({ type: 'int', default: 300 })
  size: number;

  @Column({ type: 'varchar', length: 7, default: '#000000' })
  color: string;

  @Column({ type: 'varchar', length: 7, default: '#FFFFFF' })
  backgroundColor: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logoUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
