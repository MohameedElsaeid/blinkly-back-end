import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import { Request } from 'express';
import { Link } from '../entities/link.entity';
import { DynamicLink } from '../entities/dynamic-link.entity';
import { AnalyticsService } from '../analytics/analytics.service';
import { IClickData } from '../interfaces/analytics.interface';

interface RedirectResponse {
  url: string;
  statusCode: number;
}

@Injectable()
export class RedirectService {
  private readonly logger = new Logger(RedirectService.name);

  constructor(
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
    @InjectRepository(DynamicLink)
    private readonly dynamicLinkRepository: Repository<DynamicLink>,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async handleRedirect(
    alias: string,
    clickData: Partial<IClickData>,
    req: Request,
  ): Promise<RedirectResponse> {
    try {
      // First, try to find a standard link
      const link = await this.linkRepository.findOne({
        where: { alias },
      });

      if (link) {
        return this.handleStandardLink(link, clickData);
      }

      // If no standard link is found, try to find a dynamic link
      const dynamicLink = await this.dynamicLinkRepository.findOne({
        where: { alias },
      });

      if (dynamicLink) {
        return this.handleDynamicLink(dynamicLink, clickData, req);
      }

      throw new NotFoundException('Link not found');
    } catch (error) {
      this.logger.error(
        `Failed to handle redirect for alias ${alias}: ${error.message}`,
      );
      throw error;
    }
  }

  private async handleStandardLink(
    link: Link,
    clickData: Partial<IClickData>,
  ): Promise<RedirectResponse> {
    if (!link.isActive) {
      throw new BadRequestException('Link is not active');
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new BadRequestException('Link has expired');
    }

    // Enrich click data with geolocation
    const enrichedClickData = this.enrichClickData(clickData);

    // Record the click event
    await this.analyticsService.recordClickForLink(
      link.alias,
      enrichedClickData,
    );

    return {
      url: link.originalUrl,
      statusCode: link.redirectType,
    };
  }

  private async handleDynamicLink(
    dynamicLink: DynamicLink,
    clickData: Partial<IClickData>,
    req: Request,
  ): Promise<RedirectResponse> {
    if (!dynamicLink.isActive) {
      throw new BadRequestException('Dynamic link is not active');
    }

    // Determine the appropriate URL based on the user's platform
    const targetUrl = this.determineTargetUrl(dynamicLink, req);

    // Enrich click data with geolocation
    const enrichedClickData = this.enrichClickData(clickData);

    // Record the click event
    await this.analyticsService.recordClickForDynamicLink(
      dynamicLink.alias,
      enrichedClickData,
    );

    return {
      url: targetUrl,
      statusCode: 302, // Always use temporary redirect for dynamic links
    };
  }

  private determineTargetUrl(dynamicLink: DynamicLink, req: Request): string {
    const ua = new UAParser(req.headers['user-agent']);
    const os = ua.getOS();

    // Find matching rule based on platform and version requirements
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
      if (rule.platform === 'web') {
        return true; // Web is the fallback platform
      }
      return false;
    });

    return matchingRule ? matchingRule.url : dynamicLink.defaultUrl;
  }

  private enrichClickData(clickData: Partial<IClickData>): IClickData {
    const geo = clickData.ipAddress ? geoip.lookup(clickData.ipAddress) : null;
    const ua = new UAParser(clickData.userAgent);

    return {
      ...clickData,
      country: geo?.country || 'Unknown',
      state: geo?.region || 'Unknown',
      city: geo?.city || 'Unknown',
      latitude: geo?.ll?.[0] || 0,
      longitude: geo?.ll?.[1] || 0,
      operatingSystem: ua.getOS().name || 'Unknown',
      osVersion: ua.getOS().version || 'Unknown',
      browserName: ua.getBrowser().name || 'Unknown',
      browserVersion: ua.getBrowser().version || 'Unknown',
      deviceModel: ua.getDevice().model || 'Unknown',
    } as IClickData;
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
