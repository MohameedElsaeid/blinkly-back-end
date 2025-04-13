import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
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
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<IAuthResponse> {
    // Check for existing user by email or phone number
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: signUpDto.email },
        { phoneNumber: signUpDto.phoneNumber },
      ],
    });

    if (existingUser) {
      this.logger.log('User with this email or phone number already exists');
      throw new ConflictException(
        'User with this email or phone number already exists',
      );
    }

    // Create a new user from the DTO data
    const user = this.userRepository.create({
      ...signUpDto,
    });
    const savedUser = await this.userRepository.save(user);

    // Retrieve the free plan from the plans table
    const freePlan = await this.planRepository.findOne({
      where: { name: PlanName.FREE },
    });
    if (freePlan) {
      // Create a new subscription for the user using the free plan
      const subscription = new UserSubscription();
      subscription.user = savedUser;
      subscription.plan = freePlan;
      subscription.startDate = new Date();

      // If a free trial is available, set the trial end date and mark status as TRIAL
      if (freePlan.freeTrialAvailable && freePlan.freeTrialDays) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + freePlan.freeTrialDays);
        subscription.endDate = endDate;
        subscription.status = SubscriptionStatus.TRIAL;
      } else {
        // Otherwise mark it as active immediately
        subscription.status = SubscriptionStatus.ACTIVE;
      }
      // Optionally, update user's activeSubscription field
      savedUser.activeSubscription =
        await this.userSubscriptionRepository.save(subscription);
      await this.userRepository.save(savedUser);
    } else {
      this.logger.warn('No free plan available to assign to new user');
    }

    // Generate authentication token for the new user
    const token = this.jwtService.sign({
      sub: savedUser.id,
      email: savedUser.email,
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
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('Raw Password (Login):', loginDto.password);
    console.log('Stored Hash (Login):', user.password);

    const isMatch: boolean = await user.validatePassword(loginDto.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
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
