import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { DynamicLinkClickEvent } from './dynamic-link-click-event.entity';

@Entity('dynamic_links')
export class DynamicLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  alias: string;

  // Primary or default URL.
  @Column()
  defaultUrl: string;

  // Rules for platform-specific redirection (e.g., iOS, Android, Web).
  @Column('jsonb')
  rules: Array<{
    platform: 'ios' | 'android' | 'web';
    url: string;
    minimumVersion?: string;
    packageName?: string;
  }>;

  // Optional UTM parameters for campaign tracking.
  @Column('jsonb', { nullable: true })
  utmParameters: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };

  // Social metadata fields for rich link sharing.
  @Column({ nullable: true })
  metaTitle: string;

  @Column({ nullable: true })
  metaDescription: string;

  @Column({ nullable: true })
  metaImage: string;

  @Column({ default: true })
  isActive: boolean;

  // Tags stored as a comma-separated list.
  @Column('simple-array', { nullable: true })
  tags: string[];

  // Many dynamic links belong to a single user.
  @ManyToOne(() => User, (user) => user.dynamicLinks)
  user: User;

  // Dynamic links track many click events.
  @OneToMany(
    () => DynamicLinkClickEvent,
    (clickEvent) => clickEvent.dynamicLink,
  )
  clickEvents: DynamicLinkClickEvent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // A helper to count total clicks.
  get clicks(): number {
    return this.clickEvents ? this.clickEvents.length : 0;
  }
}
