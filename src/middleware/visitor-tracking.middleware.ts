import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { DeepPartial, EntityManager, IsNull } from 'typeorm';
import { UAParser } from 'ua-parser-js';
import * as crypto from 'crypto';
import { Visit } from '../entities/visit.entity';
import { UserDevice } from '../entities/user-device.entity';
import { User } from '../entities/user.entity';
import { InjectEntityManager } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { IncomingHttpHeaders } from 'http';
import { nanoid } from 'nanoid';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

@Injectable()
export class VisitorTrackingMiddleware implements NestMiddleware {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    private readonly jwtService: JwtService,
  ) {}

  private logger() {
    return new Logger('VisitorTrackingMiddleware');
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const headers = this.transformHeaders(req.headers);
      const deviceId = this.generateDeviceId(headers);

      const user = await this.getAuthenticatedUser(req);
      const ua = new UAParser(headers.userAgent as string);

      const { geoCountry, geoLatitude, geoLongitude, geoCity } =
        this.extractGeoData(headers.xGeoData as string);

      const userDevice = await this.upsertUserDevice(user, headers, deviceId);

      if (userDevice) {
        await this.trackVisit({
          req,
          headers,
          user,
          userDevice,
          ua,
          deviceId,
          geoCountry,
          geoLatitude,
          geoLongitude,
          geoCity,
        });
      }
    } catch (error) {
      this.logger().error('Error in visitor tracking:', error);
    } finally {
      next();
    }
  }

  private transformHeaders(headers: IncomingHttpHeaders): Record<string, any> {
    const transformed: Record<string, any> = {};

    for (const [key, value] of Object.entries(headers)) {
      const camelKey = key
        .toLowerCase()
        .replace(/([-_][a-z])/g, (group) =>
          group.toUpperCase().replace('-', '').replace('_', ''),
        );

      let transformedValue: string | number | null = null;

      if (Array.isArray(value)) {
        transformedValue = value[0] || null;
      } else if (value !== undefined) {
        if (
          [
            'xDeviceMemory',
            'xScreenWidth',
            'xScreenHeight',
            'xColorDepth',
          ].includes(camelKey)
        ) {
          transformedValue = value ? parseInt(value.toString(), 10) : null;
        } else {
          transformedValue = value || null;
        }
      }

      transformed[camelKey] = transformedValue;
    }

    return transformed;
  }

  private async getAuthenticatedUser(req: Request): Promise<User | undefined> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return undefined;

      const token = authHeader.split(' ')[1];
      if (!token) return undefined;

      const payload = this.jwtService.verify(token);
      if (!payload?.sub) return undefined;

      const user = await this.manager.getRepository(User).findOne({
        where: { id: payload.sub },
        select: ['id', 'email', 'firstName', 'lastName'],
      });

      return user || undefined;
    } catch (error) {
      return undefined;
    }
  }

  private async upsertUserDevice(
    user: User | undefined,
    headers: Record<string, any>,
    deviceId: string,
  ): Promise<UserDevice | null> {
    try {
      const ua = new UAParser(headers.userAgent as string);

      // First try to find the device for this user
      let device = await this.manager.getRepository(UserDevice).findOne({
        where: {
          deviceId,
          userId: user?.id,
        },
      });

      if (!device) {
        // If no device found for this user, try to find any device with this deviceId
        device = await this.manager.getRepository(UserDevice).findOne({
          where: { deviceId },
        });

        if (device) {
          // If device exists but for a different user, update it with the new user
          device.userId = user?.id;
        } else {
          // If no device exists at all, create a new one
          device = this.manager.getRepository(UserDevice).create({
            userId: user?.id,
            deviceId,
            xDeviceId: headers.xDeviceId,
            xDeviceMemory: headers.xDeviceMemory,
            xPlatform: headers.xPlatform,
            xScreenWidth: headers.xScreenWidth,
            xScreenHeight: headers.xScreenHeight,
            xColorDepth: headers.xColorDepth,
            xTimeZone: headers.xTimeZone,
            browser: ua.getBrowser().name,
            deviceType: ua.getDevice().type,
          });
        }

        // Save the device
        device = await this.manager.getRepository(UserDevice).save(device);
      }

      return device;
    } catch (error) {
      this.logger().error('Failed to upsert user device:', error);
      return null;
    }
  }

  private async trackVisit(data: {
    req: Request;
    headers: Record<string, any>;
    user?: User;
    userDevice?: UserDevice | null;
    ua: UAParser;
    deviceId: string;
    geoCountry: string | null;
    geoLatitude: number | null;
    geoLongitude: number | null;
    geoCity: string | null;
  }): Promise<void> {
    const queryRunner = this.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!data.userDevice) {
        throw new Error('User device is required for visit tracking');
      }

      // Check for existing session
      const lastVisit = await queryRunner.manager.getRepository(Visit).findOne({
        where: {
          userDevice: { id: data.userDevice.id },
          sessionEndTime: IsNull(),
        },
        order: { timestamp: 'DESC' },
      });

      let sessionId: string;
      let sessionStartTime: Date;

      if (
        lastVisit &&
        Date.now() - lastVisit.timestamp.getTime() < SESSION_TIMEOUT
      ) {
        // Continue existing session
        sessionId = lastVisit.sessionId!;
        sessionStartTime = lastVisit.sessionStartTime!;

        // Update previous visit's session end time
        lastVisit.sessionEndTime = new Date();
        lastVisit.sessionDuration = Math.round(
          (lastVisit.sessionEndTime.getTime() -
            lastVisit.sessionStartTime!.getTime()) /
            1000,
        );
        await queryRunner.manager.save(lastVisit);
      } else {
        // Start new session
        sessionId = nanoid();
        sessionStartTime = new Date();
      }

      const visitData: DeepPartial<Visit> = {
        timestamp: new Date(),
        user: data.user,
        userDevice: data.userDevice,
        sessionId,
        sessionStartTime,
        ...this.extractVisitData(data),
        utmSource: data.req.query.utm_source as string,
        utmCampaign: data.req.query.utm_campaign as string,
      };

      const visit = queryRunner.manager.getRepository(Visit).create(visitData);
      await queryRunner.manager.save(visit);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger().error('Failed to track visit:', error);
    } finally {
      await queryRunner.release();
    }
  }

  private extractVisitData(data: any): Partial<Visit> {
    const { req, headers, ua, geoCountry, geoCity, geoLatitude, geoLongitude } =
      data;

    return {
      host: headers.host,
      cfRay: headers.cfRay,
      requestTime: new Date(),
      xDeviceMemory: headers.xDeviceMemory,
      requestId: headers.requestId,
      acceptEncoding: headers.acceptEncoding,
      xPlatform: headers.xPlatform,
      xForwardedProto: headers.xForwardedProto,
      xLanguage: headers.xLanguage,
      cfVisitorScheme: this.extractCfScheme(headers.cfVisitor),
      cfIpCountry: headers.cfIpcountry,
      geoCountry,
      geoCity,
      geoLatitude,
      geoLongitude,
      xFbClickId: req.query.fbclid as string,
      xFbBrowserId: headers.xFbBrowserId,
      cfConnectingO2O: headers.cfConnectingO2O,
      xForwardedFor: headers.xForwardedFor,
      xUserAgent: headers.xUserAgent,
      xTimeZone: headers.xTimeZone,
      xScreenWidth: headers.xScreenWidth,
      xScreenHeight: headers.xScreenHeight,
      contentType: headers.contentType,
      acceptLanguage: headers.acceptLanguage,
      accept: headers.accept,
      referer: headers.referer,
      userAgent: headers.userAgent,
      cfConnectingIp: headers.cfConnectingIp,
      deviceId: headers.deviceId,
      origin: headers.origin,
      secChUa: headers.secChUa,
      secChUaMobile: headers.secChUaMobile,
      secChUaPlatform: headers.secChUaPlatform,
      browser: ua.getBrowser().name,
      browserVersion: ua.getBrowser().version,
      os: ua.getOS().name,
      osVersion: ua.getOS().version,
      device: ua.getDevice().model,
      deviceType: ua.getDevice().type,
      queryParams: this.normalizeQueryParams(req.query),
    };
  }

  private generateDeviceId(headers: Record<string, any>): string {
    const rawFingerprint = [
      headers.userAgent,
      headers.xScreenWidth,
      headers.xScreenHeight,
      headers.xDeviceMemory,
      headers.xPlatform,
      headers.xTimeZone,
      headers.acceptLanguage,
      headers.cfConnectingIp,
      headers.xDeviceId,
    ]
      .filter(Boolean)
      .join('|');

    return crypto.createHash('sha256').update(rawFingerprint).digest('hex');
  }

  private extractGeoData(xGeoDataRaw: string | undefined): {
    geoCountry: string | null;
    geoCity: string | null;
    geoLatitude: number | null;
    geoLongitude: number | null;
  } {
    try {
      if (!xGeoDataRaw) {
        return {
          geoCountry: null,
          geoCity: null,
          geoLatitude: null,
          geoLongitude: null,
        };
      }

      const parsed = JSON.parse(xGeoDataRaw);
      return {
        geoCountry: parsed?.country || null,
        geoCity: parsed?.city || null,
        geoLatitude: parsed?.latitude || null,
        geoLongitude: parsed?.longitude || null,
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

  private extractCfScheme(cfVisitorRaw: string | null): string | null {
    if (!cfVisitorRaw) return null;
    try {
      const parsed = JSON.parse(cfVisitorRaw);
      return parsed?.scheme || null;
    } catch {
      return null;
    }
  }

  private normalizeQueryParams(params: any): Record<string, unknown> {
    if (!params) return {};

    if (typeof params === 'string') {
      try {
        return JSON.parse(params);
      } catch {
        return {};
      }
    }

    return params;
  }
}
