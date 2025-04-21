import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Link } from '../entities/link.entity';
import { ClickEvent } from '../entities/click-event.entity';
import { DynamicLinkClickEvent } from '../entities/dynamic-link-click-event.entity';
import {
  IDashboardTip,
  ITopLink,
  ITotalClicksResponse,
  LinkAnalytics,
} from './dashboard.interface';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
    @InjectRepository(ClickEvent)
    private readonly clickEventRepository: Repository<ClickEvent>,
    @InjectRepository(DynamicLinkClickEvent)
    private readonly dynamicClickEventRepository: Repository<DynamicLinkClickEvent>,
  ) {}

  async getTotalClicks(userId: string): Promise<ITotalClicksResponse> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [currentPeriodClicks, previousPeriodClicks] = await Promise.all([
      this.getClicksForPeriod(userId, thirtyDaysAgo, now),
      this.getClicksForPeriod(userId, sixtyDaysAgo, thirtyDaysAgo),
    ]);

    const trend =
      previousPeriodClicks === 0
        ? 100
        : ((currentPeriodClicks - previousPeriodClicks) /
            previousPeriodClicks) *
          100;

    return {
      totalClicks: currentPeriodClicks,
      trend,
      periodStart: thirtyDaysAgo.toISOString(),
      periodEnd: now.toISOString(),
    };
  }

  private async getClicksForPeriod(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const [standardClicks, dynamicClicks] = await Promise.all([
      this.clickEventRepository.count({
        where: {
          link: { user: { id: userId } },
          timestamp: Between(startDate, endDate),
        },
      }),
      this.dynamicClickEventRepository.count({
        where: {
          dynamicLink: { user: { id: userId } },
          timestamp: Between(startDate, endDate),
        },
      }),
    ]);

    return standardClicks + dynamicClicks;
  }

  async getTopLinks(userId: string, limit = 5): Promise<ITopLink[]> {
    const links = await this.linkRepository.find({
      where: { user: { id: userId } },
      order: { clickCount: 'DESC' },
      take: limit,
    });

    return links.map((link) => ({
      id: link.id,
      alias: link.alias,
      originalUrl: link.originalUrl,
      clickCount: link.clickCount,
    }));
  }

  private async getDetailedAnalytics(link: Link): Promise<LinkAnalytics> {
    const clicks = await this.clickEventRepository.find({
      where: { link: { id: link.id } },
      relations: ['userDevice'],
      order: { timestamp: 'DESC' },
    });

    // Get unique devices count
    const uniqueDevices = new Set(
      clicks.map((click) => click.userDevice?.deviceId),
    ).size;

    // Group by browser
    const clicksByBrowser = this.groupClicksByField(clicks, 'browser');

    // Group by device type
    const clicksByDevice = this.groupClicksByField(clicks, 'deviceType');

    // Group by OS
    const clicksByOS = this.groupClicksByField(clicks, 'os');

    // Group by country
    const clicksByCountry = this.groupClicksByField(clicks, 'geoCountry');

    // Group by city
    const clicksByCity = this.groupClicksByField(clicks, 'geoCity');

    // Group by date
    const clicksByDate = this.groupClicksByDate(clicks);

    return {
      totalClicks: clicks.length,
      uniqueDevices,
      clicksByCountry,
      clicksByCity,
      clicksByBrowser,
      clicksByDevice,
      clicksByOS,
      clicksByDate,
      recentClicks: clicks.slice(0, 5),
    };
  }

  private groupClicksByDate(clicks: ClickEvent[]): Record<string, number> {
    return clicks.reduce(
      (acc, click) => {
        if (click.timestamp) {
          const date = new Date(click.timestamp).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private groupClicksByField(
    clicks: ClickEvent[],
    field: keyof ClickEvent,
  ): Record<string, number> {
    return clicks.reduce(
      (acc, click) => {
        const value = (click[field] as string) || 'Unknown';
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  getDashboardTips(): IDashboardTip[] {
    return [
      {
        title: 'Use Custom Aliases',
        description:
          'Create memorable links by using custom aliases that are relevant to your content.',
      },
      {
        title: 'Track Analytics',
        description:
          'Monitor your link performance through the analytics dashboard to optimize your reach.',
      },
      {
        title: 'QR Codes',
        description:
          'Generate QR codes for your links to bridge offline and online marketing.',
      },
      {
        title: 'UTM Parameters',
        description:
          'Add UTM parameters to track your marketing campaigns effectively.',
      },
    ];
  }

  getDashboardTricks(): string[] {
    return [
      'Add UTM parameters to track marketing campaigns',
      'Use dynamic links for platform-specific redirects',
      'Generate QR codes for offline marketing',
      'Monitor click patterns in analytics',
      'Create branded links with custom domains',
      'Schedule links to expire automatically',
      'Use tags to organize your links',
      'Set up webhook notifications',
    ];
  }
}
