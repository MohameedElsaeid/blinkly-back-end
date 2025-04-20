// middleware/visitor-tracking.middleware.ts
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { DeepPartial, EntityManager, QueryRunner } from 'typeorm';
import { UAParser } from 'ua-parser-js';
import * as crypto from 'crypto';
import { Visit } from '../entities/visit.entity';
import { UserDevice } from '../entities/user-device.entity';
import { User } from '../entities/user.entity';
import { InjectEntityManager } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

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
      // Extract relevant headers and request data
      const headers = this.transformHeaders(req.headers);
      const deviceId = this.generateDeviceId(headers);

      this.logger().log(`Device Id : ${deviceId}`);
      // Get authenticated user if exists
      const user = await this.getAuthenticatedUser(req);

      this.logger().log(`User : ${JSON.stringify(user)}`);
      // Parse user agent
      const ua = new UAParser(headers.userAgent);

      // Extract geo data if available
      const { geoCountry, geoLatitude, geoLongitude, geoCity } =
        this.extractGeoData(headers.xGeoData);

      // Create/update user device
      const userDevice = await this.upsertUserDevice(user, headers, deviceId);

      this.logger().log(`userDevice : ${JSON.stringify(userDevice)}`);

      // Track visit
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
    } catch (error) {
      console.error('Visitor tracking failed:', error);
      // Don't block the request if tracking fails
    } finally {
      next();
    }
  }

  private transformHeaders(rawHeaders: Record<string, any>) {
    // Similar to your HeaderTransformPipe logic
    const headers: Record<string, any> = {};

    for (const [key, value] of Object.entries(rawHeaders)) {
      const camel = key
        .toLowerCase()
        .replace(/([-_][a-z])/g, (group) =>
          group.toUpperCase().replace('-', '').replace('_', ''),
        );

      let v = value === '' ? null : value;

      if (
        [
          'xDeviceMemory',
          'xHardwareConcurrency',
          'xColorDepth',
          'xScreenWidth',
          'xScreenHeight',
        ].includes(camel)
      ) {
        v = v != null ? Number(v) : null;
      }

      headers[camel] = v;
    }

    return headers;
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

  private async upsertUserDevice(
    user: User | undefined,
    headers: Record<string, any>,
    deviceId: string,
    queryRunner?: QueryRunner,
  ): Promise<UserDevice | null> {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(UserDevice)
      : this.manager.getRepository(UserDevice);

    try {
      // First try to find existing device
      let device = await this.manager.getRepository(UserDevice).findOne({
        where: {
          userId: user?.id,
          deviceId,
          xDeviceId: headers.xDeviceId,
        },
      });

      // If not found, create a new one
      if (!device) {
        device = repo.create({
          userId: user?.id,
          deviceId,
          xDeviceId: headers.xDeviceId ?? null,
          xDeviceMemory: headers.xDeviceMemory ?? null,
          xPlatform: headers.xPlatform ?? null,
          xScreenWidth: headers.xScreenWidth ?? null,
          xScreenHeight: headers.xScreenHeight ?? null,
          xColorDepth: headers.xColorDepth ?? null,
          xTimeZone: headers.xTimeZone ?? null,
        });
        await repo.save(device);
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
  }) {
    const queryRunner = this.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let userDevice = data.userDevice;

      if (data.user && !userDevice) {
        if (data.user && !userDevice) {
          userDevice = await this.upsertUserDevice(
            data.user,
            data.headers,
            data.deviceId,
            queryRunner,
          );
        }
      }

      const visitData: DeepPartial<Visit> = {
        timestamp: new Date(),
        user: data.user,
        userDeviceId: userDevice?.id ?? undefined,
        userAgent: data.headers.userAgent ?? null,
        deviceId: data.deviceId,
        cfRay: data.headers.cfRay ?? null,
        requestTime: data.headers.xRequestTime,
        cfConnectingIp: data.headers.cfConnectingIp ?? null,
        cfIpCountry: data.headers.cfIpcountry ?? null,
        acceptEncoding: data.headers.acceptEncoding ?? null,
        acceptLanguage: data.headers.acceptLanguage ?? null,
        dnt: data.headers.dnt ?? null,
        origin: data.headers.origin ?? null,
        referer: data.headers.referer ?? null,
        secChUa: data.headers.secChUa ?? null,
        secChUaMobile: data.headers.secChUaMobile ?? null,
        secChUaPlatform: data.headers.secChUaPlatform ?? null,
        secFetchDest: data.headers.secFetchDest ?? null,
        secFetchMode: data.headers.secFetchMode ?? null,
        secFetchSite: data.headers.secFetchSite ?? null,
        xPlatform: data.headers.xPlatform ?? null,
        xTimeZone: data.headers.xTimeZone ?? null,
        xColorDepth: data.headers.xColorDepth ?? null,
        xDeviceMemory: data.headers.xDeviceMemory ?? null,
        xScreenWidth: data.headers.xScreenWidth ?? null,
        xScreenHeight: data.headers.xScreenHeight ?? null,
        xForwardedProto: data.headers.xForwardedProto ?? null,
        xLanguage: data.headers.xLanguage ?? null,
        contentType: data.headers.contentType ?? null,
        cacheControl: data.headers.cacheControl ?? null,
        priority: data.headers.priority ?? null,
        queryParams: this.normalizeQueryParams(data.req.query),
        host: data.headers.host ?? null,
        requestId: data.headers.xRequestId ?? null,
        cfVisitorScheme: this.extractCfScheme(data.headers.cfVisitor),
        geoCountry: data.geoCountry,
        geoCity: data.geoCity,
        geoLatitude: data.geoLatitude,
        geoLongitude: data.geoLongitude,
        xFbBrowserId: data.headers.xFbBrowserId,
        xFbClickId: data.headers.xFbClickId,
        cfConnectingO2O: data.headers.cfConnectingO2O ?? null,
        contentLength: data.headers.contentLength,
        xForwardedFor: data.headers.xForwardedFor,
        xXsrfToken: data.headers.xXsrfToken,
        xUserAgent: data.headers.xUserAgent ?? null,
        xRequestedWith: data.headers.xRequestedWith ?? null,
        cfEwVia: data.headers.cfEwVia ?? null,
        cdnLoop: data.headers.cdnLoop ?? null,
        accept: data.headers.accept,
        xClientFeatures: data.headers.xClientFeatures ?? null,
        xCsrfToken: data.headers.xCsrfToken ?? null,
        xCustomHeader: data.headers.xCustomHeader ?? null,
        xDeviceId: data.headers.xDeviceId ?? null,
        doConnectingIp: data.headers.doConnectingIp ?? null,
        browser: data.ua.getBrowser().name ?? null,
        os: data.ua.getOS().name,
        osVersion: data.ua.getOS().version ?? null,
        device: data.ua.getDevice().model ?? null,
        deviceType: data.ua.getDevice().type,
        browserVersion: data.ua.getBrowser().version ?? null,
      };

      const visit = queryRunner.manager.getRepository(Visit).create(visitData);
      await queryRunner.manager.save(visit);

      await queryRunner.commitTransaction();

      // Store visit ID in request for response interceptor
      (data.req as any).visitId = visit.id;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger().error('Failed to track visit:', error);
    } finally {
      await queryRunner.release();
    }
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

  private async getAuthenticatedUser(req: Request): Promise<User | undefined> {
    try {
      // Get authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) return undefined;

      // Extract token
      const token = authHeader.split(' ')[1];
      if (!token) return undefined;

      // Verify and decode token
      const payload = this.jwtService.verify(token);
      if (!payload?.sub) return undefined;

      // Fetch user from database
      const user = await this.manager.getRepository(User).findOne({
        where: { id: payload.sub },
        select: ['id', 'email', 'firstName', 'lastName'],
      });

      return user ?? undefined; // Convert null to undefined
    } catch (error) {
      // Token is invalid or expired
      return undefined;
    }
  }

  private parseQueryString(queryString: string): Record<string, unknown> {
    // Remove leading ? if present
    const cleanString = queryString.startsWith('?')
      ? queryString.slice(1)
      : queryString;

    return Object.fromEntries(new URLSearchParams(cleanString).entries());
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
}
