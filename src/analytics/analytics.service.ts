import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Not, Repository } from 'typeorm';
import { Link } from '../entities/link.entity';
import { ClickEvent } from '../entities/click-event.entity';
import { DynamicLinkClickEvent } from '../entities/dynamic-link-click-event.entity';
import { QrCode } from '../entities/qr-code.entity';
import { Visit } from '../entities/visit.entity';
import { User } from '../entities/user.entity';
import {
  AnalyticsDashboardResponse,
  CampaignMetrics,
  ConversionMetrics,
  ErrorMetrics,
  LinkCreationMetrics,
  QrCodeMetrics,
  RetentionMetrics,
  SessionMetrics,
  TagMetrics,
  TimeRange,
} from './interfaces/analytics.interface';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
    @InjectRepository(ClickEvent)
    private readonly clickEventRepository: Repository<ClickEvent>,
    @InjectRepository(DynamicLinkClickEvent)
    private readonly dynamicClickEventRepository: Repository<DynamicLinkClickEvent>,
    @InjectRepository(QrCode)
    private readonly qrCodeRepository: Repository<QrCode>,
    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getDashboardMetrics(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AnalyticsDashboardResponse> {
    try {
      const timeRange = { startDate, endDate };

      const [
        linkCreation,
        sessions,
        conversions,
        campaigns,
        qrCodes,
        tags,
        retention,
        errors,
      ] = await Promise.all([
        this.getLinkCreationMetrics(userId, timeRange),
        this.getSessionMetrics(userId, timeRange),
        this.getConversionMetrics(userId, timeRange),
        this.getCampaignMetrics(userId, timeRange),
        this.getQrCodeMetrics(userId, timeRange),
        this.getTagMetrics(userId, timeRange),
        this.getRetentionMetrics(userId, timeRange),
        this.getErrorMetrics(userId, timeRange),
      ]);

      return {
        timeRange,
        linkCreation,
        sessions,
        conversions,
        campaigns,
        qrCodes,
        tags,
        retention,
        errors,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get dashboard metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  private async getLinkCreationMetrics(
    userId: string,
    timeRange: TimeRange,
  ): Promise<LinkCreationMetrics> {
    const links = await this.linkRepository.find({
      where: {
        user: { id: userId },
        createdAt: Between(timeRange.startDate, timeRange.endDate),
      },
    });

    const deletedLinks = await this.linkRepository.count({
      where: {
        user: { id: userId },
        deletedAt: Between(timeRange.startDate, timeRange.endDate),
      },
      withDeleted: true,
    });

    // Group links by creation date
    const linksByDay = links.reduce(
      (acc, link) => {
        const date = link.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalLinks: links.length,
      newLinksPerDay: Object.entries(linksByDay).map(([date, count]) => ({
        date,
        count,
      })),
      deletedLinks,
      updatedLinks: links.filter(
        (link) =>
          link.updatedAt > link.createdAt &&
          link.updatedAt >= timeRange.startDate &&
          link.updatedAt <= timeRange.endDate,
      ).length,
    };
  }

  private async getSessionMetrics(
    userId: string,
    timeRange: TimeRange,
  ): Promise<SessionMetrics> {
    const visits = await this.visitRepository.find({
      where: {
        user: { id: userId },
        timestamp: Between(timeRange.startDate, timeRange.endDate),
      },
    });

    const sessions = visits.filter((visit) => visit.sessionId);
    const totalDuration = sessions.reduce(
      (sum, visit) => sum + (visit.sessionDuration || 0),
      0,
    );

    const sessionsByDay = sessions.reduce(
      (acc, session) => {
        const date = session.timestamp.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalSessions: sessions.length,
      averageSessionDuration:
        sessions.length > 0 ? totalDuration / sessions.length : 0,
      bounceRate:
        sessions.length > 0
          ? (sessions.filter((s) => s.sessionDuration === 0).length /
              sessions.length) *
            100
          : 0,
      sessionsPerDay: Object.entries(sessionsByDay).map(([date, count]) => ({
        date,
        count,
      })),
    };
  }

  private async getConversionMetrics(
    userId: string,
    timeRange: TimeRange,
  ): Promise<ConversionMetrics> {
    const clicks = await this.clickEventRepository.find({
      where: {
        link: { user: { id: userId } },
        timestamp: Between(timeRange.startDate, timeRange.endDate),
      },
    });

    const conversions = clicks.filter((click) => click.conversionType);
    const conversionsByType = conversions.reduce(
      (acc, conv) => {
        acc[conv.conversionType!] = (acc[conv.conversionType!] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const conversionsByDay = conversions.reduce(
      (acc, conv) => {
        const date = conv.timestamp!.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { count: 0, value: 0 };
        }
        acc[date].count++;
        acc[date].value += Number(conv.conversionValue) || 0;
        return acc;
      },
      {} as Record<string, { count: number; value: number }>,
    );

    return {
      totalConversions: conversions.length,
      conversionRate:
        clicks.length > 0 ? (conversions.length / clicks.length) * 100 : 0,
      conversionsByType,
      conversionValue: conversions.reduce(
        (sum, conv) => sum + (Number(conv.conversionValue) || 0),
        0,
      ),
      conversionsPerDay: Object.entries(conversionsByDay).map(
        ([date, data]) => ({
          date,
          count: data.count,
          value: data.value,
        }),
      ),
    };
  }

  private async getCampaignMetrics(
    userId: string,
    timeRange: TimeRange,
  ): Promise<CampaignMetrics> {
    const clicks = await this.clickEventRepository.find({
      where: {
        link: { user: { id: userId } },
        timestamp: Between(timeRange.startDate, timeRange.endDate),
      },
    });

    const processUtmDimension = (
      dimension: 'utmSource' | 'utmMedium' | 'utmCampaign',
    ) => {
      const dimensionKey =
        dimension === 'utmSource'
          ? 'source'
          : dimension === 'utmMedium'
            ? 'medium'
            : 'campaign';

      return Object.entries(
        clicks.reduce(
          (acc, click) => {
            const value = click[dimension] || '(not set)';
            if (!acc[value]) {
              acc[value] = { clicks: 0, conversions: 0, value: 0 };
            }
            acc[value].clicks++;
            if (click.conversionType) {
              acc[value].conversions++;
              acc[value].value += Number(click.conversionValue) || 0;
            }
            return acc;
          },
          {} as Record<
            string,
            { clicks: number; conversions: number; value: number }
          >,
        ),
      ).map(([name, stats]) => ({
        [dimensionKey]: name,
        ...stats,
      }));
    };

    return {
      bySources: processUtmDimension('utmSource') as Array<{
        source: string;
        clicks: number;
        conversions: number;
        value: number;
      }>,
      byMediums: processUtmDimension('utmMedium') as Array<{
        medium: string;
        clicks: number;
        conversions: number;
        value: number;
      }>,
      byCampaigns: processUtmDimension('utmCampaign') as Array<{
        campaign: string;
        clicks: number;
        conversions: number;
        value: number;
      }>,
    };
  }

  private async getQrCodeMetrics(
    userId: string,
    timeRange: TimeRange,
  ): Promise<QrCodeMetrics> {
    const qrScans = await this.clickEventRepository.find({
      where: {
        link: { user: { id: userId } },
        qrCodeId: Not(IsNull()),
        timestamp: Between(timeRange.startDate, timeRange.endDate),
      },
      relations: ['qrCode'],
    });

    const scansByCode = qrScans.reduce(
      (acc, scan) => {
        const qrCodeId = scan.qrCodeId!;
        if (!acc[qrCodeId]) {
          acc[qrCodeId] = {
            qrCodeId,
            name: scan.qrCode?.targetUrl || 'Unknown',
            scans: 0,
          };
        }
        acc[qrCodeId].scans++;
        return acc;
      },
      {} as Record<string, { qrCodeId: string; name: string; scans: number }>,
    );

    const scansByDay = qrScans.reduce(
      (acc, scan) => {
        const date = scan.timestamp!.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalScans: qrScans.length,
      scansByCode: Object.values(scansByCode),
      scansPerDay: Object.entries(scansByDay).map(([date, count]) => ({
        date,
        count,
      })),
    };
  }

  private async getTagMetrics(
    userId: string,
    timeRange: TimeRange,
  ): Promise<TagMetrics> {
    const links = await this.linkRepository.find({
      where: {
        user: { id: userId },
        createdAt: Between(timeRange.startDate, timeRange.endDate),
      },
      relations: ['clickEvents'],
    });

    const tagStats = links.reduce(
      (acc, link) => {
        (link.tags || []).forEach((tag) => {
          if (!acc[tag]) {
            acc[tag] = { clicks: 0, conversions: 0 };
          }
          acc[tag].clicks += link.clickEvents.length;
          acc[tag].conversions += link.clickEvents.filter(
            (click) => click.conversionType,
          ).length;
        });
        return acc;
      },
      {} as Record<string, { clicks: number; conversions: number }>,
    );

    return {
      byTag: Object.entries(tagStats).map(([tag, stats]) => ({
        tag,
        ...stats,
      })),
    };
  }

  private async getRetentionMetrics(
    userId: string,
    timeRange: TimeRange,
  ): Promise<RetentionMetrics> {
    const visits = await this.visitRepository.find({
      where: {
        user: { id: userId },
        timestamp: Between(timeRange.startDate, timeRange.endDate),
      },
      relations: ['user'],
    });

    const uniqueVisitorsByDay = new Set(
      visits
        .filter((v) => v.timestamp >= timeRange.startDate)
        .map((v) => v.deviceId),
    ).size;

    const uniqueVisitorsByMonth = new Set(
      visits
        .filter(
          (v) =>
            v.timestamp >=
            new Date(timeRange.endDate.getTime() - 30 * 86400000),
        )
        .map((v) => v.deviceId),
    ).size;

    // Calculate weekly retention
    const weeklyRetention = Array.from({ length: 4 }).map((_, weekIndex) => {
      const weekStart = new Date(
        timeRange.startDate.getTime() + weekIndex * 7 * 86400000,
      );
      const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
      const activeUsers = new Set(
        visits
          .filter((v) => v.timestamp >= weekStart && v.timestamp < weekEnd)
          .map((v) => v.deviceId),
      ).size;

      return {
        week: weekStart.toISOString().split('T')[0],
        retentionRate:
          weekIndex === 0 ? 100 : (activeUsers / uniqueVisitorsByDay) * 100,
      };
    });

    return {
      dailyActiveUsers: uniqueVisitorsByDay,
      monthlyActiveUsers: uniqueVisitorsByMonth,
      retentionByWeek: weeklyRetention,
    };
  }

  private async getErrorMetrics(
    userId: string,
    timeRange: TimeRange,
  ): Promise<ErrorMetrics> {
    const clicks = await this.clickEventRepository.find({
      where: {
        link: { user: { id: userId } },
        timestamp: Between(timeRange.startDate, timeRange.endDate),
      },
    });

    const errors = clicks.filter(
      (click) => click.statusCode != null && click.statusCode >= 400,
    );
    const errorsByType = errors.reduce(
      (acc, error) => {
        const statusCode = error.statusCode || 0;
        acc[statusCode] = (acc[statusCode] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalResponseTime = clicks.reduce(
      (sum, click) => sum + (click.responseTime || 0),
      0,
    );

    return {
      totalErrors: errors.length,
      errorsByType,
      averageResponseTime:
        clicks.length > 0 ? totalResponseTime / clicks.length : 0,
    };
  }
}
