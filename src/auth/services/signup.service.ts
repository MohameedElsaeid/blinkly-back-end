import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SignUpDto } from '../dto/signup.dto';
import { HeaderData } from '../../interfaces/headers.interface';
import { IAuthResponse } from '../interfaces/auth.interface';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Plan, PlanName } from '../../entities/plan.entity';
import {
  SubscriptionStatus,
  UserSubscription,
} from '../../entities/user-subscription.entity';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { FacebookService } from '../../facebook/facebook.service';

@Injectable()
export class SignupService {
  private readonly logger = new Logger(SignupService.name);

  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    private readonly jwtService: JwtService,
    private readonly facebookService: FacebookService,
  ) {}

  async signUp(
    signUpDto: SignUpDto,
    headerData: HeaderData,
  ): Promise<IAuthResponse> {
    this.logger.log(`HeadersXXX:\n${JSON.stringify(headerData, null, 2)}`);
    this.logger.log(`Dev:\n${headerData.deviceId}`);

    return this.manager.transaction(async (transactionalEntityManager) => {
      try {
        // Check existing user
        await this.checkExistingUser(transactionalEntityManager, signUpDto);

        // Create and save user
        const savedUser = await this.createUser(
          transactionalEntityManager,
          signUpDto,
          headerData,
        );

        // Create free subscription
        await this.createFreeSubscription(
          transactionalEntityManager,
          savedUser,
          headerData,
        );

        // Generate JWT
        const token = this.generateToken(savedUser);

        // Track Facebook event
        await this.facebookService.trackCompleteRegistration(
          savedUser,
          headerData,
        );

        this.logger.log(`User registered: ${savedUser.email}`);
        return this.buildSuccessResponse(savedUser, token);
      } catch (error) {
        this.logger.error(`Registration failed: ${error.message}`);
        throw error;
      }
    });
  }

  // Helper methods
  private async checkExistingUser(
    manager: EntityManager,
    signUpDto: SignUpDto,
  ): Promise<void> {
    const existingUser = await manager.getRepository(User).findOne({
      where: [
        { email: signUpDto.email },
        { phoneNumber: signUpDto.phoneNumber },
      ],
    });

    if (existingUser) {
      this.logger.log('User already exists');
      throw new BadRequestException('User already exists');
    }
  }

  private async createUser(
    manager: EntityManager,
    signUpDto: SignUpDto,
    headerData: HeaderData,
  ): Promise<User> {
    const user = manager.getRepository(User).create({
      ...signUpDto,
      ipAddress: headerData.cfConnectingIp,
    });
    return manager.getRepository(User).save(user);
  }

  private async createFreeSubscription(
    manager: EntityManager,
    user: User,
    headerData: HeaderData,
  ): Promise<void> {
    const freePlan = await manager.getRepository(Plan).findOne({
      where: { name: PlanName.FREE },
      cache: true,
    });

    if (!freePlan) {
      this.logger.error('Free plan not found');
      throw new InternalServerErrorException('System configuration error');
    }

    const subscription = manager.getRepository(UserSubscription).create({
      user,
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

    user.activeSubscription = await manager
      .getRepository(UserSubscription)
      .save(subscription);
    await manager.getRepository(User).save(user);

    // Track Facebook event for free subscription
    await this.facebookService.trackStartTrial(user, headerData, freePlan.name);
    await this.facebookService.trackSubscribe(
      user,
      headerData,
      freePlan.name,
      0,
      'USD',
    );
  }

  private generateDeviceId(headerData: Record<string, any>): string {
    const rawFingerprint = [
      headerData.userAgent,
      headerData.xScreenWidth,
      headerData.xScreenHeight,
      headerData.xDeviceMemory,
      headerData.xPlatform,
      headerData.xTimeZone,
      headerData.acceptLanguage,
      headerData.cfConnectingIp,
      headerData.xDeviceId, // optional custom
    ]
      .filter(Boolean) // remove undefined/null
      .join('|');

    return crypto.createHash('sha256').update(rawFingerprint).digest('hex');
  }

  private generateToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
  }

  private buildSuccessResponse(user: User, token: string): IAuthResponse {
    return {
      success: true,
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        token,
      },
    };
  }
}
