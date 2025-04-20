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
import { DeepPartial, EntityManager } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Plan, PlanName } from '../../entities/plan.entity';
import {
  SubscriptionStatus,
  UserSubscription,
} from '../../entities/user-subscription.entity';
import { UserDevice } from '../../entities/user-device.entity';
import { Visit } from '../../entities/visit.entity';
import { JwtService } from '@nestjs/jwt';
import { UAParser } from 'ua-parser-js';
import * as crypto from 'crypto';

@Injectable()
export class SignupService {
  private readonly logger = new Logger(SignupService.name);

  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    private readonly jwtService: JwtService,
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
        );

        // Create/update user device
        const userDevice = await this.upsertUserDevice(
          transactionalEntityManager,
          savedUser,
          headerData,
        );

        // Track visit
        await this.trackVisit(
          transactionalEntityManager,
          savedUser,
          userDevice[0],
          headerData,
        );

        // Generate JWT
        const token = this.generateToken(savedUser);

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
  }

  private async upsertUserDevice(
    manager: EntityManager,
    user: User,
    headerData: HeaderData,
  ): Promise<UserDevice[]> {
    const result = await manager.getRepository(UserDevice).upsert(
      {
        userId: user.id, // Using relation
        deviceId: headerData.deviceId,
        xDeviceId: headerData.xDeviceId ?? null,
        xDeviceMemory: headerData.xDeviceMemory ?? null,
        xPlatform: headerData.xPlatform ?? null,
        xScreenWidth: headerData.xScreenWidth ?? null,
        xScreenHeight: headerData.xScreenHeight ?? null,
        xColorDepth: headerData.xColorDepth ?? null,
        xTimeZone: headerData.xTimeZone ?? null,
      },
      ['userId', 'deviceId', 'xDeviceId'],
    );

    return manager.getRepository(UserDevice).find({
      where: { id: result.identifiers[0].id },
    });
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

  private async trackVisit(
    manager: EntityManager,
    user: User,
    userDevice: UserDevice,
    headerData: HeaderData,
  ): Promise<void> {
    const { geoCountry, geoLatitude, geoLongitude, geoCity } =
      this.extractGeoData(headerData.xGeoData);

    const ua = new UAParser(headerData.userAgent);
    const deviceId = this.generateDeviceId(headerData);

    const visitData: DeepPartial<Visit> = {
      timestamp: new Date(),
      user: user, // Use the relation property, not userId
      userDevice: userDevice, // Use the relation property, not userDeviceId
      userDeviceId: userDevice?.id,
      userAgent: headerData.userAgent ?? null,
      deviceId: deviceId,
      cfRay: headerData.cfRay ?? null,
      requestTime: headerData.xRequestTime,
      cfConnectingIp: headerData.cfConnectingIp ?? null,
      cfIpCountry: headerData.cfIpcountry ?? null,
      acceptEncoding: headerData.acceptEncoding ?? null,
      acceptLanguage: headerData.acceptLanguage ?? null,
      dnt: headerData.dnt ?? null,
      origin: headerData.origin ?? null,
      referer: headerData.referer ?? null,
      secChUa: headerData.secChUa ?? null,
      secChUaMobile: headerData.secChUaMobile ?? null,
      secChUaPlatform: headerData.secChUaPlatform ?? null,
      secFetchDest: headerData.secFetchDest ?? null,
      secFetchMode: headerData.secFetchMode ?? null,
      secFetchSite: headerData.secFetchSite ?? null,
      xPlatform: headerData.xPlatform ?? null,
      xTimeZone: headerData.xTimeZone ?? null,
      xColorDepth: headerData.xColorDepth ?? null,
      xDeviceMemory: headerData.xDeviceMemory ?? null,
      xScreenWidth: headerData.xScreenWidth ?? null,
      xScreenHeight: headerData.xScreenHeight ?? null,
      xForwardedProto: headerData.xForwardedProto ?? null,
      xLanguage: headerData.xLanguage ?? null,
      contentType: headerData.contentType ?? null,
      cacheControl: headerData.cacheControl ?? null,
      priority: headerData.priority ?? null,
      queryParams: this.normalizeQueryParams(headerData.queryParams),
      host: headerData.host ?? null,
      requestId: headerData.xRequestId ?? null,
      cfVisitorScheme: this.extractCfScheme(headerData.cfVisitor),
      geoCountry: geoCountry,
      geoCity: geoCity,
      geoLatitude: geoLatitude,
      geoLongitude: geoLongitude,
      xFbBrowserId: headerData.xFbBrowserId,
      xFbClickId: headerData.xFbClickId,
      cfConnectingO2O: headerData.cfConnectingO2O ?? null,
      contentLength: headerData.contentLength,
      xForwardedFor: headerData.xForwardedFor,
      xXsrfToken: headerData.xXsrfToken,
      xUserAgent: headerData.xUserAgent ?? null,
      xRequestedWith: headerData.xRequestedWith ?? null,
      cfEwVia: headerData.cfEwVia ?? null,
      cdnLoop: headerData.cdnLoop ?? null,
      accept: headerData.accept,
      xClientFeatures: headerData.xClientFeatures ?? null,
      xCsrfToken: headerData.xCsrfToken ?? null,
      xCustomHeader: headerData.xCustomHeader ?? null,
      xDeviceId: headerData.xDeviceId ?? null,
      doConnectingIp: headerData.doConnectingIp ?? null,
      browser: ua.getBrowser().name ?? null,
      os: ua.getOS().name,
      osVersion: ua.getOS().version ?? null,
      device: ua.getDevice().model ?? null,
      deviceType: ua.getDevice().type,
      browserVersion: ua.getBrowser().version ?? null,
    };

    const visit = manager.getRepository(Visit).create(visitData);
    await manager.save(visit);
  }

  private extractGeoData(xGeoDataRaw: string | null | undefined): {
    geoCountry: string | null;
    geoCity: string | null;
    geoLatitude: number | null;
    geoLongitude: number | null;
  } {
    try {
      if (xGeoDataRaw === null || xGeoDataRaw === undefined) {
        return {
          geoCountry: null,
          geoCity: null,
          geoLatitude: null,
          geoLongitude: null,
        };
      }

      const parsed = JSON.parse(xGeoDataRaw);

      return {
        geoCountry: parsed?.country?.toLowerCase?.() || '',
        geoCity: parsed?.city || '',
        geoLatitude: parsed?.latitude || '',
        geoLongitude: parsed?.longitude || '',
      };
    } catch {
      return {
        geoCountry: null,
        geoCity: null,
        geoLatitude: null,
        geoLongitude: null,
      };
    }
  }

  private extractCfScheme(
    cfVisitorRaw: string | null | undefined,
  ): string | null {
    if (cfVisitorRaw === null || cfVisitorRaw === undefined) {
      return null;
    }

    try {
      const parsed = JSON.parse(cfVisitorRaw);
      return typeof parsed?.scheme === 'string' ? parsed.scheme : null;
    } catch (err) {
      return null;
    }
  }

  private normalizeQueryParams(
    params: unknown,
  ): Record<string, unknown> | undefined {
    // Handle null/undefined cases
    if (!params) return undefined;

    // If it's already a proper object
    if (typeof params === 'object' && !Array.isArray(params)) {
      return this.cleanQueryParams(params as Record<string, unknown>);
    }

    // If it's a string (URL or query string)
    if (typeof params === 'string') {
      try {
        // Try parsing as JSON first
        if (params.trim().startsWith('{')) {
          return this.cleanQueryParams(JSON.parse(params));
        }
        // Otherwise parse as query string
        return this.parseQueryString(params);
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  private cleanQueryParams(
    params: Record<string, unknown>,
  ): Record<string, unknown> {
    const cleanParams: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(params)) {
      // Skip null/undefined values
      if (value === null || value === undefined) continue;

      // Handle different value types
      if (typeof value === 'string') {
        // Convert comma-separated strings to arrays if needed
        cleanParams[key] = value.includes(',')
          ? value.split(',').map((item) => item.trim())
          : value;
      } else if (Array.isArray(value)) {
        // Ensure array items are properly formatted
        cleanParams[key] = value.map((item) =>
          typeof item === 'string' ? item.trim() : item,
        );
      } else {
        // Keep other types as-is (numbers, booleans, etc.)
        cleanParams[key] = value;
      }
    }

    return cleanParams;
  }

  private parseQueryString(queryString: string): Record<string, unknown> {
    // Remove leading ? if present
    const cleanString = queryString.startsWith('?')
      ? queryString.slice(1)
      : queryString;

    return Object.fromEntries(new URLSearchParams(cleanString).entries());
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
