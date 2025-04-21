import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { Link } from '../entities/link.entity';
import { DynamicLink } from '../entities/dynamic-link.entity';
import { IClickData } from '../interfaces/analytics.interface';
import { UAParser } from 'ua-parser-js';
import { RedirectResponse } from './interfaces/redirect.interface';
import { ClickEvent } from '../entities/click-event.entity';
import { DynamicLinkClickEvent } from '../entities/dynamic-link-click-event.entity';
import { UserDevice } from '../entities/user-device.entity';

@Injectable()
export class RedirectService {
  private readonly logger = new Logger(RedirectService.name);

  constructor(
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
    @InjectRepository(DynamicLink)
    private readonly dynamicLinkRepository: Repository<DynamicLink>,
    @InjectRepository(ClickEvent)
    private readonly clickEventRepository: Repository<ClickEvent>,
    @InjectRepository(DynamicLinkClickEvent)
    private readonly dynamicClickEventRepository: Repository<DynamicLinkClickEvent>,
    @InjectRepository(UserDevice)
    private readonly userDeviceRepository: Repository<UserDevice>,
  ) {}

  async handleRedirect(
    alias: string,
    clickData: Partial<IClickData>,
    req: Request,
  ): Promise<RedirectResponse> {
    try {
      const link = await this.linkRepository.findOne({
        where: { alias },
        relations: ['user'],
      });

      if (link) {
        await this.trackClickEvent(link, req);
        const enrichedClickData = this.enrichClickData(clickData, req);
        return this.handleStandardLink(link, enrichedClickData);
      }

      const dynamicLink = await this.dynamicLinkRepository.findOne({
        where: { alias },
        relations: ['user'],
      });

      if (dynamicLink) {
        await this.trackDynamicClickEvent(dynamicLink, req);
        const enrichedClickData = this.enrichClickData(clickData, req);
        return this.handleDynamicLink(dynamicLink, enrichedClickData, req);
      }

      throw new NotFoundException('Link not found');
    } catch (error) {
      this.logger.error(
        `Failed to handle redirect for alias ${alias}: ${error.message}`,
      );
      throw error;
    }
  }

  private enrichClickData(
    clickData: Partial<IClickData>,
    req: Request,
  ): IClickData {
    const headers = req.headers;
    const { geoCountry, geoLatitude, geoLongitude, geoCity } =
      this.extractGeoData(headers['x-geo-data'] as string);

    return {
      ipAddress: (headers['cf-connecting-ip'] as string) || 'Unknown',
      userAgent: (headers['user-agent'] as string) || 'Unknown',
      referrer: (headers.referer as string) || 'Unknown',
      country: geoCountry || (headers['cf-ipcountry'] as string) || 'Unknown',
      state: 'Unknown',
      city: geoCity || (headers['cf-ipcity'] as string) || 'Unknown',
      latitude:
        geoLatitude || parseFloat(headers['cf-iplatitude'] as string) || 0,
      longitude:
        geoLongitude || parseFloat(headers['cf-iplongitude'] as string) || 0,
      sessionId: 'Unknown',
      utmSource: (req.query.utm_source as string) || 'Unknown',
      utmMedium: (req.query.utm_medium as string) || 'Unknown',
      utmCampaign: (req.query.utm_campaign as string) || 'Unknown',
      utmTerm: (req.query.utm_term as string) || 'Unknown',
      utmContent: (req.query.utm_content as string) || 'Unknown',
      cfRay: (headers['cf-ray'] as string) || 'Unknown',
      cfVisitor: (headers['cf-visitor'] as string) || 'Unknown',
      cfDeviceType: (headers['cf-device-type'] as string) || 'Unknown',
      cfMetroCode: (headers['cf-metro-code'] as string) || 'Unknown',
      cfRegion: (headers['cf-region'] as string) || 'Unknown',
      cfRegionCode: (headers['cf-region-code'] as string) || 'Unknown',
      cfConnectingIp: (headers['cf-connecting-ip'] as string) || 'Unknown',
      cfIpCity: geoCity || (headers['cf-ipcity'] as string) || 'Unknown',
      cfIpContinent: (headers['cf-ipcontinent'] as string) || 'Unknown',
      cfIpLatitude:
        String(geoLatitude) || (headers['cf-iplatitude'] as string) || '0',
      cfIpLongitude:
        String(geoLongitude) || (headers['cf-iplongitude'] as string) || '0',
      cfIpTimeZone: (headers['cf-iptimezone'] as string) || 'Unknown',
    };
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

  private async trackClickEvent(link: Link, req: Request): Promise<void> {
    try {
      const headers = this.transformHeaders(req.headers);
      const deviceId = await this.getOrCreateUserDevice(headers);
      const ua = new UAParser(headers.userAgent as string);

      const clickEvent = this.clickEventRepository.create({
        link,
        userDevice: deviceId,
        timestamp: new Date(),
        ...this.extractClickData(req),
        browser: ua.getBrowser().name || null,
        browserVersion: ua.getBrowser().version || null,
        os: ua.getOS().name || null,
        osVersion: ua.getOS().version || null,
        device: ua.getDevice().model || null,
        deviceType: ua.getDevice().type || null,
        queryParams: req.query || null,
      });

      await this.clickEventRepository.save(clickEvent);

      // Update link click count
      link.clickCount = (link.clickCount || 0) + 1;
      await this.linkRepository.save(link);
    } catch (error) {
      this.logger.error(`Failed to track click event: ${error.message}`);
    }
  }

  private async trackDynamicClickEvent(
    dynamicLink: DynamicLink,
    req: Request,
  ): Promise<void> {
    try {
      const headers = this.transformHeaders(req.headers);
      const deviceId = await this.getOrCreateUserDevice(headers);
      const ua = new UAParser(headers.userAgent as string);

      const clickEvent = this.dynamicClickEventRepository.create({
        dynamicLink,
        userDevice: deviceId,
        timestamp: new Date(),
        ...this.extractClickData(req),
        browser: ua.getBrowser().name || null,
        browserVersion: ua.getBrowser().version || null,
        os: ua.getOS().name || null,
        osVersion: ua.getOS().version || null,
        device: ua.getDevice().model || null,
        deviceType: ua.getDevice().type || null,
        queryParams: req.query || null,
      });

      await this.dynamicClickEventRepository.save(clickEvent);
    } catch (error) {
      this.logger.error(
        `Failed to track dynamic click event: ${error.message}`,
      );
    }
  }

  private async getOrCreateUserDevice(
    headers: Record<string, any>,
  ): Promise<UserDevice> {
    const deviceId = this.generateDeviceId(headers);

    let device = await this.userDeviceRepository.findOne({
      where: { deviceId },
    });

    if (!device) {
      device = this.userDeviceRepository.create({
        deviceId,
        xDeviceId: headers.xDeviceId || null,
        xDeviceMemory: headers.xDeviceMemory || null,
        xPlatform: headers.xPlatform || null,
        xScreenWidth: headers.xScreenWidth || null,
        xScreenHeight: headers.xScreenHeight || null,
        xColorDepth: headers.xColorDepth || null,
        xTimeZone: headers.xTimeZone || null,
      });
      await this.userDeviceRepository.save(device);
    }

    return device;
  }

  private extractClickData(req: Request): Record<string, any> {
    const headers = req.headers;
    const query = req.query;
    const ua = new UAParser(headers['user-agent'] as string);
    const { geoCountry, geoLatitude, geoLongitude, geoCity } =
      this.extractGeoData(headers['x-geo-data'] as string);

    return {
      host: headers.host,
      cfRay: headers['cf-ray'],
      requestTime: new Date(),
      xDeviceMemory: headers['x-device-memory'],
      requestId: headers['x-request-id'],
      acceptEncoding: headers['accept-encoding'],
      xPlatform: headers['x-platform'],
      xForwardedProto: headers['x-forwarded-proto'],
      xLanguage: headers['x-language'],
      cfVisitorScheme: headers['cf-visitor'],
      cfIpCountry: headers['cf-ipcountry'],
      geoCountry,
      geoCity,
      geoLatitude,
      geoLongitude,
      xFbClickId: query.fbclid,
      xFbBrowserId: headers['x-fb-browser-id'],
      cfConnectingO2O: headers['cf-connecting-o2o'],
      xForwardedFor: headers['x-forwarded-for'],
      xUserAgent: headers['x-user-agent'],
      xTimeZone: headers['x-timezone'],
      xScreenWidth: headers['x-screen-width'],
      xScreenHeight: headers['x-screen-height'],
      contentType: headers['content-type'],
      acceptLanguage: headers['accept-language'],
      accept: headers.accept,
      referer: headers.referer,
      userAgent: headers['user-agent'],
      cfConnectingIp: headers['cf-connecting-ip'],
      deviceId: headers['device-id'],
      origin: headers.origin,
      secChUa: headers['sec-ch-ua'],
      secChUaMobile: headers['sec-ch-ua-mobile'],
      secChUaPlatform: headers['sec-ch-ua-platform'],
      browser: ua.getBrowser().name || null,
      browserVersion: ua.getBrowser().version || null,
      os: ua.getOS().name || null,
      osVersion: ua.getOS().version || null,
      device: ua.getDevice().model || null,
      deviceType: ua.getDevice().type || null,
      queryParams: query || null,
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

    return require('crypto')
      .createHash('sha256')
      .update(rawFingerprint)
      .digest('hex');
  }

  private transformHeaders(
    headers: Record<string, string | string[] | undefined>,
  ): Record<string, string | number | null> {
    const transformed: Record<string, string | number | null> = {};

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

  private handleStandardLink(
    link: Link,
    clickData: IClickData,
  ): RedirectResponse {
    if (!link.isActive) {
      throw new BadRequestException('Link is not active');
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new BadRequestException('Link has expired');
    }

    return {
      target: link.originalUrl,
      statusCode: link.redirectType,
      user: {
        subscription: {
          plan: link.user?.activeSubscription?.plan?.name || 'FREE',
        },
      },
    };
  }

  private handleDynamicLink(
    dynamicLink: DynamicLink,
    clickData: IClickData,
    req: Request,
  ): RedirectResponse {
    if (!dynamicLink.isActive) {
      throw new BadRequestException('Dynamic link is not active');
    }

    const targetUrl = this.determineTargetUrl(dynamicLink, req);

    return {
      target: targetUrl,
      statusCode: 302,
      user: {
        subscription: {
          plan: dynamicLink.user?.activeSubscription?.plan?.name || 'FREE',
        },
      },
    };
  }

  private determineTargetUrl(dynamicLink: DynamicLink, req: Request): string {
    const ua = new UAParser(req.headers['user-agent']);
    const os = ua.getOS();

    const matchingRule = dynamicLink.rules.find((rule) => {
      if (rule.platform === 'ios' && os.name?.toLowerCase().includes('ios')) {
        return (
          !rule.minimumVersion ||
          this.compareVersions(os.version || '', rule.minimumVersion) >= 0
        );
      }
      if (
        rule.platform === 'android' &&
        os.name?.toLowerCase().includes('android')
      ) {
        return (
          !rule.minimumVersion ||
          this.compareVersions(os.version || '', rule.minimumVersion) >= 0
        );
      }
      return rule.platform === 'web';
    });

    return matchingRule ? matchingRule.url : dynamicLink.defaultUrl;
  }

  private compareVersions(version1: string, version2: string): number {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      if (num1 !== num2) {
        return num1 - num2;
      }
    }
    return 0;
  }
}
