import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Link } from '../entities/link.entity';
import { ClickEvent } from '../entities/click-event.entity';
import { DynamicLinkClickEvent } from '../entities/dynamic-link-click-event.entity';
import {
  IDashboardTip,
  ITopLink,
  ITotalClicksResponse,
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
