import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { ClickEvent } from '../entities/click-event.entity';
import { DynamicLinkClickEvent } from '../entities/dynamic-link-click-event.entity';
import { Link } from '../entities/link.entity';
import { DynamicLink } from '../entities/dynamic-link.entity';
import { User } from '../entities/user.entity';
import { UAParser } from 'ua-parser-js';
import { PlanName } from '../entities/plan.entity';
import {
  BrowserMetric,
  CountryMetric,
  DeviceMetric,
  IAnalyticsOverview,
  IClickData,
  IClicksByMetric,
  IDateRangeAnalytics,
  ILinkAnalytics,
} from '../interfaces/analytics.interface';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(ClickEvent)
    private readonly clickEventRepository: Repository<ClickEvent>,
    @InjectRepository(DynamicLinkClickEvent)
    private readonly dynamicClickEventRepository: Repository<DynamicLinkClickEvent>,
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
    @InjectRepository(DynamicLink)
    private readonly dynamicLinkRepository: Repository<DynamicLink>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async recordClickForLink(
    alias: string,
    clickData: IClickData,
  ): Promise<ClickEvent> {
    const link = await this.linkRepository.findOne({
      where: { alias },
      relations: [
        'user',
        'user.activeSubscription',
        'user.activeSubscription.plan',
      ],
    });

    if (!link) {
      throw new NotFoundException(`Link with alias ${alias} not found`);
    }

    if (!link.isActive) {
      throw new BadRequestException('Link is not active');
    }
    try {
      const ua = new UAParser(clickData.userAgent);
      const clickEvent = this.clickEventRepository.create({
        link,
        ...clickData,
        operatingSystem: ua.getOS().name,
        osVersion: ua.getOS().version,
        browserName: ua.getBrowser().name,
        browserVersion: ua.getBrowser().version,
        deviceModel: ua.getDevice().model,
      });

      await this.clickEventRepository.save(clickEvent);

      link.clickCount = (link.clickCount || 0) + 1;
      await this.linkRepository.save(link);

      return clickEvent;
    } catch (error) {
      this.logger.error(`Failed to record click for link: ${error.message}`);
      throw error;
    }
  }

  async recordClickForDynamicLink(
    alias: string,
    clickData: Record<string, any>,
  ): Promise<DynamicLinkClickEvent> {
    const dynamicLink = await this.dynamicLinkRepository.findOne({
      where: { alias },
      relations: [
        'user',
        'user.activeSubscription',
        'user.activeSubscription.plan',
      ],
    });

    if (!dynamicLink) {
      throw new NotFoundException(`Dynamic link with alias ${alias} not found`);
    }

    if (!dynamicLink.isActive) {
      throw new BadRequestException('Dynamic link is not active');
    }
    try {
      // Ensure clickData.userAgent is treated as a string.
      const ua = new UAParser(String(clickData.userAgent));
      const clickEvent = this.dynamicClickEventRepository.create({
        dynamicLink,
        ...clickData,
        operatingSystem: ua.getOS().name,
        osVersion: ua.getOS().version,
        browserName: ua.getBrowser().name,
        browserVersion: ua.getBrowser().version,
        deviceModel: ua.getDevice().model,
      });

      return await this.dynamicClickEventRepository.save(clickEvent);
    } catch (error) {
      this.logger.error(
        `Failed to record click for dynamic link: ${error.message}`,
      );
      throw error;
    }
  }

  async getLinkAnalytics(
    userId: string,
    linkId: string,
  ): Promise<ILinkAnalytics> {
    const user = await this.validateUserAndSubscription(userId);
    const link = await this.linkRepository.findOne({
      where: { id: linkId, user: { id: userId } },
      relations: ['clickEvents'],
    });

    if (!link) {
      throw new NotFoundException(`Link with ID ${linkId} not found`);
    }
    try {
      const analytics: ILinkAnalytics = {
        totalClicks: link.clickCount || 0,
        events: [],
      };

      if (user.activeSubscription?.plan.name !== PlanName.FREE) {
        analytics.events = link.clickEvents;
      }

      return analytics;
    } catch (error) {
      this.logger.error(`Failed to get link analytics: ${error.message}`);
      throw error;
    }
  }

  async getLinkAnalyticsByDateRange(
    userId: string,
    linkId: string,
    start: string,
    end: string,
  ): Promise<IDateRangeAnalytics> {
    const user = await this.validateUserAndSubscription(userId);
    const link = await this.linkRepository.findOne({
      where: { id: linkId, user: { id: userId } },
    });

    if (!link) {
      throw new NotFoundException(`Link with ID ${linkId} not found`);
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    try {
      const events = await this.clickEventRepository.find({
        where: {
          link: { id: linkId },
          timestamp: Between(startDate, endDate),
        },
      });

      const clicksByDate: { [key: string]: number } = {};
      events.forEach((event) => {
        const date = event.timestamp.toISOString().split('T')[0];
        clicksByDate[date] = (clicksByDate[date] || 0) + 1;
      });

      return {
        totalClicks: events.length,
        events:
          user.activeSubscription?.plan.name !== PlanName.FREE ? events : [],
        clicksByDate,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get link analytics by date range: ${error.message}`,
      );
      throw error;
    }
  }

  async getClicksByDevice(userId: string): Promise<IClicksByMetric> {
    try {
      await this.validateUserAndSubscription(userId);

      const queryBuilder = this.clickEventRepository
        .createQueryBuilder('click')
        .innerJoin('click.link', 'link')
        .where('link.userId = :userId', { userId })
        .select('click.deviceModel', 'device')
        .addSelect('COUNT(click.id)', 'count')
        .groupBy('click.deviceModel');

      const results = await queryBuilder.getRawMany<DeviceMetric>();
      return results.reduce<IClicksByMetric>((acc, curr) => {
        const key = curr.device || 'Unknown';
        acc[key] = parseInt(curr.count, 10);
        return acc;
      }, {});
    } catch (error) {
      this.logger.error(`Failed to get clicks by device: ${error.message}`);
      throw error;
    }
  }

  async getClicksByBrowser(userId: string): Promise<IClicksByMetric> {
    try {
      await this.validateUserAndSubscription(userId);

      const queryBuilder = this.clickEventRepository
        .createQueryBuilder('click')
        .innerJoin('click.link', 'link')
        .where('link.userId = :userId', { userId })
        .select('click.browserName', 'browser')
        .addSelect('COUNT(click.id)', 'count')
        .groupBy('click.browserName');

      const results = await queryBuilder.getRawMany<BrowserMetric>();
      return results.reduce<IClicksByMetric>((acc, curr) => {
        const key = curr.browser || 'Unknown';
        acc[key] = parseInt(curr.count, 10);
        return acc;
      }, {});
    } catch (error) {
      this.logger.error(`Failed to get clicks by browser: ${error.message}`);
      throw error;
    }
  }

  async getClicksByCountry(userId: string): Promise<IClicksByMetric> {
    try {
      await this.validateUserAndSubscription(userId);

      const queryBuilder = this.clickEventRepository
        .createQueryBuilder('click')
        .innerJoin('click.link', 'link')
        .where('link.userId = :userId', { userId })
        .select('click.country', 'country')
        .addSelect('COUNT(click.id)', 'count')
        .groupBy('click.country');

      const results = await queryBuilder.getRawMany<CountryMetric>();
      return results.reduce<IClicksByMetric>((acc, curr) => {
        const key = curr.country || 'Unknown';
        acc[key] = parseInt(curr.count, 10);
        return acc;
      }, {});
    } catch (error) {
      this.logger.error(`Failed to get clicks by country: ${error.message}`);
      throw error;
    }
  }

  async getAnalyticsOverview(userId: string): Promise<IAnalyticsOverview> {
    try {
      const user = await this.validateUserAndSubscription(userId);

      const standardClicksCount = await this.clickEventRepository.count({
        where: { link: { user: { id: userId } } },
      });

      const dynamicClicksCount = await this.dynamicClickEventRepository.count({
        where: { dynamicLink: { user: { id: userId } } },
      });

      const overview: IAnalyticsOverview = {
        totalClicks: standardClicksCount + dynamicClicksCount,
        standardClicks: standardClicksCount,
        dynamicClicks: dynamicClicksCount,
      };

      if (user.activeSubscription?.plan.name !== PlanName.FREE) {
        const recentClicks = await this.clickEventRepository.find({
          where: { link: { user: { id: userId } } },
          order: { timestamp: 'DESC' },
          take: 10,
          relations: ['link'],
        });

        overview.recentClicks = recentClicks;
      }

      return overview;
    } catch (error) {
      this.logger.error(`Failed to get analytics overview: ${error.message}`);
      throw error;
    }
  }

  private async validateUserAndSubscription(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['activeSubscription', 'activeSubscription.plan'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.activeSubscription) {
      throw new BadRequestException('No active subscription found');
    }

    return user;
  }
}
