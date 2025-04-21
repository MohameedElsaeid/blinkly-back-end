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

@Injectable()
export class RedirectService {
  private readonly logger = new Logger(RedirectService.name);

  constructor(
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
    @InjectRepository(DynamicLink)
    private readonly dynamicLinkRepository: Repository<DynamicLink>,
  ) {}

  async handleRedirect(
    alias: string,
    clickData: Partial<IClickData>,
    req: Request,
  ): Promise<RedirectResponse> {
    try {
      const link = await this.linkRepository.findOne({
        where: { alias },
      });

      if (link) {
        return this.handleStandardLink(
          link,
          this.enrichClickData(clickData, req),
        );
      }

      const dynamicLink = await this.dynamicLinkRepository.findOne({
        where: { alias },
      });

      if (dynamicLink) {
        return this.handleDynamicLink(
          dynamicLink,
          this.enrichClickData(clickData, req),
          req,
        );
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

    // Get geolocation data from Cloudflare headers or fallback to existing data
    const geoData = {
      country: headers['cf-ipcountry'] || clickData.country || 'Unknown',
      city: headers['cf-ipcity'] || clickData.city || 'Unknown',
      latitude: headers['cf-iplatitude'] || clickData.latitude || null,
      longitude: headers['cf-iplongitude'] || clickData.longitude || null,
    };

    return {
      ...clickData,
      ...geoData,
      cfRay: (headers['cf-ray'] as string) || 'Unknown',
      cfVisitor: (headers['cf-visitor'] as string) || 'Unknown',
      cfDeviceType: (headers['cf-device-type'] as string) || 'Unknown',
      cfMetroCode: (headers['cf-metro-code'] as string) || 'Unknown',
      cfRegion: (headers['cf-region'] as string) || 'Unknown',
      cfRegionCode: (headers['cf-region-code'] as string) || 'Unknown',
      cfConnectingIp:
        (headers['cf-connecting-ip'] as string) ||
        clickData.ipAddress ||
        'Unknown',
      cfIpCity: (headers['cf-ipcity'] as string) || geoData.city,
      cfIpContinent: (headers['cf-ipcontinent'] as string) || 'Unknown',
      cfIpLatitude:
        (headers['cf-iplatitude'] as string) || String(geoData.latitude),
      cfIpLongitude:
        (headers['cf-iplongitude'] as string) || String(geoData.longitude),
      cfIpTimeZone: (headers['cf-iptimezone'] as string) || 'Unknown',
      // Ensure base click data has fallback values
      ipAddress:
        clickData.ipAddress ||
        (headers['cf-connecting-ip'] as string) ||
        'Unknown',
      userAgent:
        clickData.userAgent || (headers['user-agent'] as string) || 'Unknown',
      referrer:
        clickData.referrer || (headers['referer'] as string) || 'Unknown',
      country: geoData.country,
      city: geoData.city,
      latitude: geoData.latitude,
      longitude: geoData.longitude,
    } as IClickData;
  }

  private async handleStandardLink(
    link: Link,
    clickData: IClickData,
  ): Promise<RedirectResponse> {
    if (!link.isActive) {
      throw new BadRequestException('Link is not active');
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new BadRequestException('Link has expired');
    }

    this.logger.log(link);
    return {
      target: link.originalUrl,
      statusCode: link.redirectType,
    };
  }

  private async handleDynamicLink(
    dynamicLink: DynamicLink,
    clickData: IClickData,
    req: Request,
  ): Promise<RedirectResponse> {
    if (!dynamicLink.isActive) {
      throw new BadRequestException('Dynamic link is not active');
    }

    const targetUrl = this.determineTargetUrl(dynamicLink, req);

    return {
      target: targetUrl,
      statusCode: 302,
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
