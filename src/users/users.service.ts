import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Link } from '../entities/link.entity';
import { DynamicLink } from '../entities/dynamic-link.entity';
import { QrCode } from '../entities/qr-code.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { JwtService } from '@nestjs/jwt';
import {
  UsageStats,
  UserProfileResponse,
} from './interfaces/user-profile.interface';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
    @InjectRepository(DynamicLink)
    private readonly dynamicLinkRepository: Repository<DynamicLink>,
    @InjectRepository(QrCode)
    private readonly qrCodeRepository: Repository<QrCode>,
    private readonly jwtService: JwtService,
  ) {}

  private sanitizeUser(
    user: User,
  ): Omit<User, 'password' | 'role' | 'validatePassword' | 'hashPassword'> {
    const { password, role, ...safeUser } = user;

    // Preserve the entity methods while removing sensitive data
    return {
      ...safeUser,
      getFullName: user.getFullName.bind(user),
      getFullPhoneNumber: user.getFullPhoneNumber.bind(user),
      getFullAddress: user.getFullAddress.bind(user),
      isAdmin: user.isAdmin.bind(user),
    };
  }

  async getProfile(userId: string): Promise<UserProfileResponse> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['activeSubscription', 'activeSubscription.plan'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get current month's start date
      const currentMonthStart = new Date();
      currentMonthStart.setDate(1);
      currentMonthStart.setHours(0, 0, 0, 0);

      // Get counts for current month
      const [linksCount, dynamicLinksCount, qrCodesCount] = await Promise.all([
        this.linkRepository.count({
          where: {
            user: { id: userId },
            createdAt: MoreThan(currentMonthStart),
          },
        }),
        this.dynamicLinkRepository.count({
          where: {
            user: { id: userId },
            createdAt: MoreThan(currentMonthStart),
          },
        }),
        this.qrCodeRepository.count({
          where: {
            user: { id: userId },
            createdAt: MoreThan(currentMonthStart),
          },
        }),
      ]);

      // Get limits from subscription plan
      const shortenedLinksLimit =
        user.activeSubscription?.plan?.shortenedLinksLimit ?? null;
      const qrCodesLimit = user.activeSubscription?.plan?.qrCodesLimit ?? null;
      const dynamicLinksLimit =
        user.activeSubscription?.plan?.dynamicLinksLimit ?? 0;

      // Calculate remaining counts
      const usage: UsageStats = {
        links: {
          count: linksCount,
          limit: shortenedLinksLimit,
          remaining:
            shortenedLinksLimit !== null
              ? Math.max(0, shortenedLinksLimit - linksCount)
              : null,
        },
        dynamicLinks: {
          count: dynamicLinksCount,
          limit: dynamicLinksLimit, // Using same limit as regular links
          remaining:
            dynamicLinksLimit !== null
              ? Math.max(0, dynamicLinksLimit - dynamicLinksCount)
              : null,
        },
        qrCodes: {
          count: qrCodesCount,
          limit: qrCodesLimit,
          remaining:
            qrCodesLimit !== null
              ? Math.max(0, qrCodesLimit - qrCodesCount)
              : null,
        },
      };

      const safeUser = this.sanitizeUser(user);
      return { ...safeUser, usage };
    } catch (error) {
      this.logger.error(`Failed to get user profile: ${error.message}`);
      throw error;
    }
  }

  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<
    Omit<User, 'password' | 'role' | 'validatePassword' | 'hashPassword'>
  > {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      Object.assign(user, updateUserDto);
      const savedUser = await this.userRepository.save(user);
      return this.sanitizeUser(savedUser);
    } catch (error) {
      this.logger.error(`Failed to update user profile: ${error.message}`);
      throw error;
    }
  }

  async verifyEmail(
    userId: string,
    verifyEmailDto: VerifyEmailDto,
  ): Promise<
    Omit<User, 'password' | 'role' | 'validatePassword' | 'hashPassword'>
  > {
    try {
      const payload = this.jwtService.verify(verifyEmailDto.token);
      if (payload.sub !== userId) {
        throw new BadRequestException('Invalid verification token');
      }

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.isEmailVerified = true;
      const savedUser = await this.userRepository.save(user);
      return this.sanitizeUser(savedUser);
    } catch (error) {
      this.logger.error(`Failed to verify email: ${error.message}`);
      throw error;
    }
  }

  async verifyPhone(
    userId: string,
    verifyPhoneDto: VerifyPhoneDto,
  ): Promise<
    Omit<User, 'password' | 'role' | 'validatePassword' | 'hashPassword'>
  > {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.phoneNumber !== verifyPhoneDto.phoneNumber) {
        throw new BadRequestException('Phone number does not match');
      }

      // Here you would typically verify the code against a stored verification code
      // For now, we'll just mark the phone as verified
      user.isPhoneVerified = true;
      const savedUser = await this.userRepository.save(user);
      return this.sanitizeUser(savedUser);
    } catch (error) {
      this.logger.error(`Failed to verify phone: ${error.message}`);
      throw error;
    }
  }
}
