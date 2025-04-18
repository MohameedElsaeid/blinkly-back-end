import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: signUpDto.email },
        { phoneNumber: signUpDto.phoneNumber },
      ],
    });

    if (existingUser) {
      this.logger.log('User with this email or phone number already exists');
      throw new BadRequestException(
        'User with this email or phone number already exists',
      );
    }

    const user = this.userRepository.create({
      ...signUpDto,
      ipAddress: headerData.cfConnectingIp,
    });

    const savedUser = await this.userRepository.save(user);

    const freePlan = await this.planRepository.findOne({
      where: { name: PlanName.FREE },
    });

    if (freePlan) {
      const subscription = new UserSubscription();
      subscription.user = savedUser;
      subscription.plan = freePlan;
      subscription.startDate = new Date();

      if (freePlan.freeTrialAvailable && freePlan.freeTrialDays) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + freePlan.freeTrialDays);
        subscription.endDate = endDate;
        subscription.status = SubscriptionStatus.TRIAL;
      } else {
        subscription.status = SubscriptionStatus.ACTIVE;
      }

      savedUser.activeSubscription =
        await this.userSubscriptionRepository.save(subscription);
      await this.userRepository.save(savedUser);
    } else {
      this.logger.warn('No free plan available to assign to new user');
    }

    const token = this.jwtService.sign({
      sub: savedUser.id,
      email: savedUser.email,
    });

    await this.visitorService.trackVisitor(savedUser.id, {
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
      } as Record<string, string>,
    });

    this.logger.log(`User registered successfully: ${savedUser.email}`);
    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        token: token,
      },
    };
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
