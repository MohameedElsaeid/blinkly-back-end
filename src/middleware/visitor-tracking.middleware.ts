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
import { v4 as uuidv4 } from 'uuid';

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

      const userDevice = await this.upsertUserDevice(
        user,
        headers,
        deviceId,
        ua,
      );

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
    ua: UAParser,
  ): Promise<UserDevice | null> {
    const queryRunner = this.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // First try to find the device with exact match
      let device = await queryRunner.manager.getRepository(UserDevice).findOne({
        where: {
          deviceId,
          userId: user?.id || IsNull(),
          xDeviceId: headers.xDeviceId || IsNull(),
        },
      });

      if (!device) {
        // If not found, create new device
        device = queryRunner.manager.getRepository(UserDevice).create({
          id: uuidv4(),
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
          fingerprintHash: deviceId,
        });
      } else {
        // Update existing device
        device.userId = user?.id;
        device.xDeviceMemory = headers.xDeviceMemory || device.xDeviceMemory;
        device.xPlatform = headers.xPlatform || device.xPlatform;
        device.xScreenWidth = headers.xScreenWidth || device.xScreenWidth;
        device.xScreenHeight = headers.xScreenHeight || device.xScreenHeight;
        device.xColorDepth = headers.xColorDepth || device.xColorDepth;
        device.xTimeZone = headers.xTimeZone || device.xTimeZone;
        device.browser = ua.getBrowser().name || device.browser;
        device.deviceType = ua.getDevice().type || device.deviceType;
      }

      device = await queryRunner.manager.save(device);
      await queryRunner.commitTransaction();

      return device;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger().error('Failed to upsert user device:', error);
      return null;
    } finally {
      await queryRunner.release();
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

      const now = new Date();
      const sessionId = lastVisit?.sessionId || uuidv4();

      if (
        lastVisit &&
        now.getTime() - lastVisit.timestamp.getTime() < SESSION_TIMEOUT
      ) {
        // Update previous visit's session end time
        lastVisit.sessionEndTime = now;
        lastVisit.sessionDuration = Math.round(
          (now.getTime() - lastVisit.sessionStartTime!.getTime()) / 1000,
        );
        await queryRunner.manager.save(lastVisit);
      }

      const visitData: DeepPartial<Visit> = {
        id: uuidv4(),
        timestamp: now,
        user: data.user,
        userDevice: data.userDevice,
        sessionId,
        sessionStartTime: lastVisit ? lastVisit.sessionStartTime : now,
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

  private extractVisitData(data: any): Record<string, any> {
    const headers = data.headers;
    const ua = data.ua;

    return {
      host: headers.host,
      cfRay: headers.cfRay,
      requestTime: new Date(),
      xDeviceMemory: headers.xDeviceMemory,
      acceptEncoding: headers.acceptEncoding,
      xPlatform: headers.xPlatform,
      xForwardedProto: headers.xForwardedProto,
      xLanguage: headers.xLanguage,
      cfVisitorScheme: headers.cfVisitor,
      cfIpCountry: headers.cfIpcountry,
      geoCountry: data.geoCountry,
      geoCity: data.geoCity,
      geoLatitude: data.geoLatitude,
      geoLongitude: data.geoLongitude,
      xFbBrowserId: headers.xFbBrowserId,
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
      queryParams: data.req.query || {},
    };
  }
}
