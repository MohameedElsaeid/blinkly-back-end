import { User } from '../../entities/user.entity';

export interface UsageStats {
  links: {
    count: number;
    limit: number | null;
    remaining: number | null;
  };
  dynamicLinks: {
    count: number;
    limit: number | null;
    remaining: number | null;
  };
  qrCodes: {
    count: number;
    limit: number | null;
    remaining: number | null;
  };
}

export type SafeUser = Omit<
  User,
  'password' | 'role' | 'validatePassword' | 'hashPassword'
>;

export interface UserProfileResponse extends SafeUser {
  usage: UsageStats;
}
