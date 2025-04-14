import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { DynamicLink } from './dynamic-link.entity';
import { Link } from './link.entity';
import { UserSubscription } from './user-subscription.entity';
import { QrCode } from './qr-code.entity';
import { WebhookEndpoint } from './webhook-endpoint.entity';
import { Visitor } from './visitor.entity';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  firstName: string;

  @Column({ type: 'varchar', length: 50 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 10 })
  countryCode: string;

  @Column({ type: 'varchar', length: 20 })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isPhoneVerified: boolean;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profilePicture: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  preferredLanguage: string;

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone: string;

  @OneToMany(() => Link, (link) => link.user)
  links: Link[];

  @OneToMany(() => DynamicLink, (dynamicLink) => dynamicLink.user)
  dynamicLinks: DynamicLink[];

  @OneToMany(() => QrCode, (qrCode) => qrCode.user)
  qrCodes: QrCode[];

  @OneToMany(() => UserSubscription, (subscription) => subscription.user)
  subscriptions: UserSubscription[];

  @OneToOne(() => UserSubscription, { nullable: true })
  @JoinColumn()
  activeSubscription: UserSubscription;

  @OneToMany(() => WebhookEndpoint, (webhook) => webhook.user)
  webhookEndpoints: WebhookEndpoint[];

  @OneToMany(() => Visitor, (visitor) => visitor.user)
  visitors: Visitor[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  getFullPhoneNumber(): string {
    return `${this.countryCode}${this.phoneNumber}`;
  }

  getFullAddress(): string | null {
    if (!this.address) return null;
    return `${this.address}${this.city ? `, ${this.city}` : ''}${this.postalCode ? ` ${this.postalCode}` : ''}`;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }
}
