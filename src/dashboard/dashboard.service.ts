import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Link } from '../entities/link.entity';
import { ClickEvent } from '../entities/click-event.entity';
import {
  ClickPerformanceMetrics,
  DashboardAnalytics,
  DeviceAnalytics,
  GeographicAnalytics,
  IDashboardTip,
  ITopLink,
  ITotalClicksResponse,
  TopReferrersResponse,
} from './dashboard.interface';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
    @InjectRepository(ClickEvent)
    private readonly clickEventRepository: Repository<ClickEvent>,
  ) {}

  async getTopReferrers(
    userId: string,
    options: {
      startDate?: string;
      endDate?: string;
      limit?: number;
      page?: number;
      sortBy?: 'visits' | 'revenue' | 'conversion_rate';
    },
  ): Promise<TopReferrersResponse> {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate = new Date().toISOString(),
      limit = 10,
      page = 1,
      sortBy = 'visits',
    } = options;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all clicks for the period
    const clicks = await this.clickEventRepository.find({
      where: {
        link: { user: { id: userId } },
        timestamp: Between(start, end),
      },
      relations: ['link'],
    });

    // Group clicks by referrer
    const referrerMap = new Map<
      string,
      {
        visits: number;
        bounces: number;
        totalDuration: number;
        conversions: number;
        revenue: number;
        sessions: Set<string>;
      }
    >();

    clicks.forEach((click) => {
      const referrer = click.referer?.toLowerCase() || '(direct)';
      const sessionId = click.deviceId || 'unknown';

      if (!referrerMap.has(referrer)) {
        referrerMap.set(referrer, {
          visits: 0,
          bounces: 0,
          totalDuration: 0,
          conversions: 0,
          revenue: 0,
          sessions: new Set(),
        });
      }

      const stats = referrerMap.get(referrer)!;
      stats.visits++;
      stats.sessions.add(sessionId);

      // Simulate conversion and revenue data (in real app, this would come from actual conversion tracking)
      if (Math.random() > 0.8) {
        stats.conversions++;
        stats.revenue += Math.floor(Math.random() * 100);
      }
    });

    // Calculate metrics and sort
    let referrers = Array.from(referrerMap.entries()).map(([source, stats]) => {
      const bounceRate = (stats.bounces / stats.visits) * 100;
      const avgSessionDuration = stats.totalDuration / stats.sessions.size;
      const conversionRate = (stats.conversions / stats.visits) * 100;

      return {
        source,
        total_visits: stats.visits,
        bounce_rate: Math.round(bounceRate * 100) / 100,
        avg_session_duration: Math.round(avgSessionDuration),
        conversion_rate: Math.round(conversionRate * 100) / 100,
        total_revenue: Math.round(stats.revenue * 100) / 100,
        change_percentage: 0, // Would be calculated by comparing to previous period
      };
    });

    // Sort results
    referrers.sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.total_revenue - a.total_revenue;
        case 'conversion_rate':
          return b.conversion_rate - a.conversion_rate;
        case 'visits':
        default:
          return b.total_visits - a.total_visits;
      }
    });

    // Calculate pagination
    const total = referrers.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    referrers = referrers.slice(offset, offset + limit);

    return {
      data: referrers,
      meta: {
        total,
        page,
        limit,
        total_pages: totalPages,
      },
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };
  }

  async getGeographicDistribution(
    userId: string,
    days: number,
  ): Promise<GeographicAnalytics> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const clicks = await this.clickEventRepository.find({
      where: {
        link: { user: { id: userId } },
        timestamp: Between(startDate, now),
      },
      select: ['geoCountry', 'geoCity', 'geoLatitude', 'geoLongitude'],
    });

    const total = clicks.length;

    // Count by country
    const countryDistribution = clicks.reduce(
      (acc, click) => {
        const country = click.geoCountry?.toLowerCase() || 'unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Count by city
    const cityDistribution = clicks.reduce(
      (acc, click) => {
        const city = click.geoCity?.toLowerCase() || 'unknown';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Calculate percentages
    const countryPercentages = Object.entries(countryDistribution).reduce(
      (acc, [country, count]) => {
        acc[country] = total > 0 ? Math.round((count / total) * 100) : 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    const cityPercentages = Object.entries(cityDistribution).reduce(
      (acc, [city, count]) => {
        acc[city] = total > 0 ? Math.round((count / total) * 100) : 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get unique locations with coordinates
    const locations = clicks.reduce(
      (acc, click) => {
        if (click.geoLatitude && click.geoLongitude && click.geoCity) {
          const key = `${click.geoLatitude},${click.geoLongitude}`;
          if (!acc[key]) {
            acc[key] = {
              city: click.geoCity,
              country: click.geoCountry || 'Unknown',
              latitude: click.geoLatitude,
              longitude: click.geoLongitude,
              count: 0,
            };
          }
          acc[key].count++;
        }
        return acc;
      },
      {} as Record<string, any>,
    );

    return {
      total_clicks: total,
      period_start: startDate.toISOString(),
      period_end: now.toISOString(),
      countries: {
        distribution: countryDistribution,
        percentages: countryPercentages,
      },
      cities: {
        distribution: cityDistribution,
        percentages: cityPercentages,
      },
      locations: Object.values(locations),
      unique_countries: Object.keys(countryDistribution).length,
      unique_cities: Object.keys(cityDistribution).length,
    };
  }

  async getDeviceDistribution(
    userId: string,
    days: number,
  ): Promise<DeviceAnalytics> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const clicks = await this.clickEventRepository.find({
      where: {
        link: { user: { id: userId } },
        timestamp: Between(startDate, now),
      },
      select: [
        'deviceType',
        'browser',
        'browserVersion',
        'os',
        'osVersion',
        'device',
      ],
    });

    const total = clicks.length;

    // Track unique devices/browsers/OS
    const uniqueDevices = new Set(
      clicks.map((click) => click.device).filter(Boolean),
    );
    const uniqueBrowsers = new Set(
      clicks.map((click) => click.browser).filter(Boolean),
    );
    const uniqueOS = new Set(clicks.map((click) => click.os).filter(Boolean));

    // Helper function to create distribution and percentages
    const createDistribution = (
      field: keyof Pick<
        ClickEvent,
        | 'deviceType'
        | 'browser'
        | 'browserVersion'
        | 'os'
        | 'osVersion'
        | 'device'
      >,
    ) => {
      const distribution = clicks.reduce(
        (acc, click) => {
          const value = click[field]?.toLowerCase() || 'unknown';
          acc[value] = (acc[value] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const percentages = Object.entries(distribution).reduce(
        (acc, [key, count]) => {
          acc[key] = total > 0 ? Math.round((count / total) * 100) : 0;
          return acc;
        },
        {} as Record<string, number>,
      );

      return { distribution, percentages };
    };

    // Get distributions for all metrics
    const devices = createDistribution('deviceType');
    const browsers = createDistribution('browser');
    const browserVersions = createDistribution('browserVersion');
    const operatingSystems = createDistribution('os');
    const osVersions = createDistribution('osVersion');

    return {
      total_clicks: total,
      period_start: startDate.toISOString(),
      period_end: now.toISOString(),
      devices,
      browsers,
      operating_systems: operatingSystems,
      browser_versions: browserVersions,
      os_versions: osVersions,
      unique_devices: uniqueDevices.size,
      unique_browsers: uniqueBrowsers.size,
      unique_operating_systems: uniqueOS.size,
    };
  }

  async getDashboardAnalytics(userId: string): Promise<DashboardAnalytics> {
    try {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const last24h = new Date(now);
      last24h.setHours(last24h.getHours() - 24);
      const previous24h = new Date(last24h);
      previous24h.setHours(previous24h.getHours() - 24);
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [
        todayClicks,
        yesterdayClicks,
        links24h,
        linksPrevious24h,
        countries24h,
        countriesPrevious24h,
        ctr,
      ] = await Promise.all([
        this.getClicksCount(userId, today, now),
        this.getClicksCount(userId, yesterday, today),
        this.getLinksCreatedCount(userId, last24h, now),
        this.getLinksCreatedCount(userId, previous24h, last24h),
        this.getUniqueCountriesCount(userId, last24h, now),
        this.getUniqueCountriesCount(userId, previous24h, last24h),
        this.getAverageCTR(userId, sevenDaysAgo, now),
      ]);

      return {
        clicks_today: {
          count: todayClicks,
          change_percentage: this.calculateChangePercentage(
            todayClicks,
            yesterdayClicks,
          ),
        },
        links_24h: {
          count: links24h,
          change_percentage: this.calculateChangePercentage(
            links24h,
            linksPrevious24h,
          ),
        },
        unique_countries_24h: {
          count: countries24h,
          change_percentage: this.calculateChangePercentage(
            countries24h,
            countriesPrevious24h,
          ),
        },
        avg_ctr_7d: {
          percentage: Math.round(ctr * 100) / 100,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get dashboard analytics: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  private async getClicksCount(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return await this.clickEventRepository.count({
      where: {
        link: { user: { id: userId } },
        timestamp: Between(startDate, endDate),
      },
    });
  }

  private async getLinksCreatedCount(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return await this.linkRepository.count({
      where: {
        user: { id: userId },
        createdAt: Between(startDate, endDate),
      },
    });
  }

  private async getUniqueCountriesCount(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const clicks = await this.clickEventRepository
      .createQueryBuilder('click')
      .select('DISTINCT click.geoCountry')
      .where('click.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('click.geoCountry IS NOT NULL')
      .innerJoin('click.link', 'link')
      .innerJoin('link.user', 'user')
      .andWhere('user.id = :userId', { userId })
      .getRawMany();

    return clicks.length;
  }

  private async getAverageCTR(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const links = await this.linkRepository.find({
      where: {
        user: { id: userId },
        createdAt: Between(startDate, endDate),
      },
      relations: ['clickEvents'],
    });

    if (links.length === 0) return 0;

    const totalClicks = links.reduce((sum, link) => sum + link.clickCount, 0);
    const totalLinks = links.length;

    return Math.round((totalClicks / totalLinks) * 100) / 100;
  }

  private calculateChangePercentage(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  }

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
    return await this.clickEventRepository.count({
      where: {
        link: { user: { id: userId } },
        timestamp: Between(startDate, endDate),
      },
    });
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

  async getClickPerformance(
    userId: string,
    options: {
      startDate?: string;
      endDate?: string;
      metric?: 'clicks' | 'visitors';
    },
  ): Promise<ClickPerformanceMetrics> {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate = new Date().toISOString(),
      metric = 'clicks',
    } = options;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all clicks for the period
    const clicks = await this.clickEventRepository.find({
      where: {
        link: { user: { id: userId } },
        timestamp: Between(start, end),
      },
      relations: ['userDevice'],
      order: { timestamp: 'ASC' },
    });

    // Initialize metrics
    const dailyMetrics = new Map<
      string,
      { clicks: number; visitors: Set<string> }
    >();
    const totalUniqueVisitors = new Set<string>();

    // Process clicks
    clicks.forEach((click) => {
      if (click.timestamp) {
        const date = click.timestamp.toISOString().split('T')[0];
        const deviceId = click.userDevice?.deviceId || 'unknown';

        if (!dailyMetrics.has(date)) {
          dailyMetrics.set(date, { clicks: 0, visitors: new Set() });
        }

        const dayMetrics = dailyMetrics.get(date)!;
        dayMetrics.clicks++;
        dayMetrics.visitors.add(deviceId);
        totalUniqueVisitors.add(deviceId);
      }
    });

    // Fill in missing dates with zero values
    const allDates = this.generateDateRange(start, end);
    allDates.forEach((date) => {
      if (!dailyMetrics.has(date)) {
        dailyMetrics.set(date, { clicks: 0, visitors: new Set() });
      }
    });

    // Format the response
    const dailyMetricsArray = Array.from(dailyMetrics.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, metrics]) => ({
        date,
        clicks: metrics.clicks,
        unique_visitors: metrics.visitors.size,
      }));

    return {
      total_clicks: clicks.length,
      unique_visitors: totalUniqueVisitors.size,
      daily_metrics: dailyMetricsArray,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };
  }

  private generateDateRange(start: Date, end: Date): string[] {
    const dates: string[] = [];
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }
}
