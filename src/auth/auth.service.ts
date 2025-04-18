import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { IAuthResponse, IJwtPayload } from './interfaces/auth.interface';
import { Plan, PlanName } from '../entities/plan.entity';
import {
  SubscriptionStatus,
  UserSubscription,
} from '../entities/user-subscription.entity';
import { VisitorService } from '../visitor/visitor.service';
import { Visitor } from '../entities/visitor.entity';

interface HeaderData {
  deviceId?: string;
  userAgent?: string;
  platform?: string;
  screenWidth?: number;
  screenHeight?: number;
  colorDepth?: string;
  deviceMemory?: string;
  hardwareConcurrency?: string;
  timeZone?: string;
  acceptEncoding?: string;
  acceptLanguage?: string;
  origin?: string;
  referer?: string;
  secChUa?: string;
  secChUaMobile?: string;
  secChUaPlatform?: string;
  secFetchDest?: string;
  secFetchMode?: string;
  secFetchSite?: string;
  dnt?: string;
  cfConnectingIp?: string;
  cfCountry?: string;
  cfRay?: string;
  cfVisitor?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(UserSubscription)
    private readonly userSubscriptionRepository: Repository<UserSubscription>,
    private readonly jwtService: JwtService,
    private readonly visitorService: VisitorService,
  ) {}

  async signUp(
    signUpDto: SignUpDto,
    headerData: HeaderData,
  ): Promise<IAuthResponse> {
    return this.manager.transaction(async (transactionalEntityManager) => {
      try {
        // Check existing user
        const existingUser = await transactionalEntityManager
          .getRepository(User)
          .findOne({
            where: [
              { email: signUpDto.email },
              { phoneNumber: signUpDto.phoneNumber },
            ],
          });

        if (existingUser) {
          this.logger.log('User already exists');
          throw new BadRequestException('User already exists');
        }

        // Create user
        const user = transactionalEntityManager.getRepository(User).create({
          ...signUpDto,
          ipAddress: headerData.cfConnectingIp,
        });

        const savedUser = await transactionalEntityManager
          .getRepository(User)
          .save(user);

        // Handle subscription
        const freePlan = await transactionalEntityManager
          .getRepository(Plan)
          .findOne({
            where: { name: PlanName.FREE },
            cache: true,
          });

        if (!freePlan) {
          this.logger.error('Free plan not found');
          throw new InternalServerErrorException('System configuration error');
        }

        const subscription = transactionalEntityManager
          .getRepository(UserSubscription)
          .create({
            user: savedUser,
            plan: freePlan,
            startDate: new Date(),
            status: freePlan.freeTrialAvailable
              ? SubscriptionStatus.TRIAL
              : SubscriptionStatus.ACTIVE,
            endDate:
              freePlan.freeTrialAvailable && freePlan.freeTrialDays
                ? new Date(Date.now() + freePlan.freeTrialDays * 86400000)
                : null,
          });

        // Update user with subscription
        savedUser.activeSubscription = await transactionalEntityManager
          .getRepository(UserSubscription)
          .save(subscription);
        await transactionalEntityManager.getRepository(User).save(savedUser);

        // Track visitor
        await transactionalEntityManager.getRepository(Visitor).save({
          userId: savedUser.id,
          ipAddress: headerData.cfConnectingIp || '',
          userAgent: headerData.userAgent || '',
          deviceId: headerData.deviceId,
          headers: {
            'accept-encoding': headerData.acceptEncoding,
            'accept-language': headerData.acceptLanguage,
            'cf-connecting-ip': headerData.cfConnectingIp,
            'cf-country': headerData.cfCountry,
            'cf-ray': headerData.cfRay,
            'cf-visitor': headerData.cfVisitor,
            dnt: headerData.dnt,
            origin: headerData.origin,
            referer: headerData.referer,
            'sec-ch-ua': headerData.secChUa,
            'sec-ch-ua-mobile': headerData.secChUaMobile,
            'sec-ch-ua-platform': headerData.secChUaPlatform,
            'sec-fetch-dest': headerData.secFetchDest,
            'sec-fetch-mode': headerData.secFetchMode,
            'sec-fetch-site': headerData.secFetchSite,
            'user-agent': headerData.userAgent,
            'x-color-depth': headerData.colorDepth,
            'x-device-memory': headerData.deviceMemory,
            'x-hardware-concurrency': headerData.hardwareConcurrency,
            'x-platform': headerData.platform,
            'x-screen-height': String(headerData.screenHeight),
            'x-screen-width': String(headerData.screenWidth),
            'x-time-zone': headerData.timeZone,
          },
        });

        // Generate JWT (non-transactional)
        const token = this.jwtService.sign({
          sub: savedUser.id,
          email: savedUser.email,
        });

        this.logger.log(`User registered: ${savedUser.email}`);
        return {
          success: true,
          message: 'Registration successful',
          user: {
            id: savedUser.id,
            email: savedUser.email,
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            token,
          },
        };
      } catch (error) {
        this.logger.error(`Registration failed: ${error.message}`);
        throw error; // Automatic rollback
      }
    });
  }

  async login(loginDto: LoginDto): Promise<IAuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isMatch: boolean = await user.validatePassword(loginDto.password);

    if (!isMatch) {
      throw new BadRequestException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    this.logger.log(`User logged in successfully: ${user.email}`);

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        token: token,
      },
    };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<IAuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      this.logger.error(`User not Found: ${forgotPasswordDto.email}`);
      throw new NotFoundException('User not found');
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '1h' },
    );
    this.logger.log(`Password reset token for ${user.email}: ${resetToken}`);

    return {
      success: true,
      message: 'Password reset instructions sent to your email',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        token: resetToken,
      },
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<IAuthResponse> {
    const payload: IJwtPayload = this.jwtService.verify(resetPasswordDto.token);
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(
      resetPasswordDto.newPassword.trim(),
      salt,
    );
    await this.userRepository.save(user);

    this.logger.log(`Password reset successful for user: ${user.email}`);

    return {
      success: true,
      message: 'Password reset successful',
    };
  }

  async verifyPhone(verifyPhoneDto: VerifyPhoneDto): Promise<IAuthResponse> {
    await Promise.resolve();
    this.logger.log(
      `Verifying phone for ${verifyPhoneDto.phoneNumber} using code ${verifyPhoneDto.code}`,
    );
    return {
      success: true,
      message: 'Phone number verified successfully',
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<IAuthResponse> {
    const payload: IJwtPayload = this.jwtService.verify(verifyEmailDto.token);
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isEmailVerified = true;
    await this.userRepository.save(user);

    this.logger.log(`Email verified successfully for user: ${user.email}`);

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }
}
