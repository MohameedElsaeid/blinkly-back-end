import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { customAlphabet } from 'nanoid';
import { UAParser } from 'ua-parser-js';
import { Link, RedirectType } from '../entities/link.entity';
import { DynamicLink } from '../entities/dynamic-link.entity';
import { ClickEvent } from '../entities/click-event.entity';
import { DynamicLinkClickEvent } from '../entities/dynamic-link-click-event.entity';
import { User } from '../entities/user.entity';
import { CreateLinkDto } from './dto/create-link.dto';
import { CreateDynamicLinkDto } from './dto/create-dynamic-link.dto';
import { PlanName } from '../entities/plan.entity';

const nanoid = customAlphabet(
  '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  8,
);

interface AnalyticsResponse {
  totalClicks: number;
  clicksByDate: { [key: string]: number };
  browsers?: { [key: string]: number };
  operatingSystems?: { [key: string]: number };
  countries?: { [key: string]: number };
  referrers?: { [key: string]: number };
  utmSources?: { [key: string]: number };
  devices?: { [key: string]: number };
}

@Injectable()
export class LinksService {
  private readonly logger = new Logger(LinksService.name);

  constructor(
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
    @InjectRepository(DynamicLink)
    private readonly dynamicLinkRepository: Repository<DynamicLink>,
    @InjectRepository(ClickEvent)
    private readonly clickEventRepository: Repository<ClickEvent>,
    @InjectRepository(DynamicLinkClickEvent)
    private readonly dynamicLinkClickEventRepository: Repository<DynamicLinkClickEvent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createLink(
    userId: string,
    createLinkDto: CreateLinkDto,
  ): Promise<Link> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['activeSubscription', 'activeSubscription.plan'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      !user.activeSubscription ||
      user.activeSubscription.status !== 'active'
    ) {
      throw new BadRequestException('Active subscription required');
    }

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const linksCount = await this.linkRepository.count({
      where: {
        user: { id: userId },
        createdAt: MoreThan(currentMonthStart),
      },
    });

    const linkLimit = user.activeSubscription.plan.shortenedLinksLimit;
    if (linkLimit !== null && linksCount >= linkLimit) {
      throw new BadRequestException(
        `Monthly link limit (${linkLimit}) reached`,
      );
    }

    const alias = createLinkDto.alias || nanoid();
    const existingLink = await this.linkRepository.findOne({
      where: { alias },
    });

    if (existingLink) {
      throw new BadRequestException('Alias already exists');
    }

    const link = this.linkRepository.create({
      ...createLinkDto,
      alias,
      user,
      redirectType: createLinkDto.redirectType || RedirectType.TEMPORARY,
    });

    return await this.linkRepository.save(link);
  }

  async getAnalytics(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AnalyticsResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['activeSubscription', 'activeSubscription.plan'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const queryBuilder = this.clickEventRepository
      .createQueryBuilder('click')
      .innerJoin('click.link', 'link')
      .where('link.userId = :userId', { userId });

    if (startDate && endDate) {
      queryBuilder.andWhere('click.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const clicks = await queryBuilder.getMany();

    const analytics: AnalyticsResponse = {
      totalClicks: clicks.length,
      clicksByDate: {},
    };

    if (user.activeSubscription?.plan.name !== PlanName.FREE) {
      analytics.browsers = {};
      analytics.operatingSystems = {};
      analytics.countries = {};

      if (
        [
          PlanName.PROFESSIONAL,
          PlanName.BUSINESS,
          PlanName.ENTERPRISE,
        ].includes(user.activeSubscription.plan.name)
      ) {
        analytics.referrers = {};
        analytics.utmSources = {};
        analytics.devices = {};
      }
    }

    clicks.forEach((click) => {
      const date = click.timestamp.toISOString().split('T')[0];
      analytics.clicksByDate[date] = (analytics.clicksByDate[date] || 0) + 1;

      if (user.activeSubscription?.plan.name !== PlanName.FREE) {
        if (analytics.browsers && click.browserName) {
          analytics.browsers[click.browserName] =
            (analytics.browsers[click.browserName] || 0) + 1;
        }
        if (analytics.operatingSystems && click.operatingSystem) {
          analytics.operatingSystems[click.operatingSystem] =
            (analytics.operatingSystems[click.operatingSystem] || 0) + 1;
        }
        if (analytics.countries && click.country) {
          analytics.countries[click.country] =
            (analytics.countries[click.country] || 0) + 1;
        }

        if (
          [
            PlanName.PROFESSIONAL,
            PlanName.BUSINESS,
            PlanName.ENTERPRISE,
          ].includes(user.activeSubscription.plan.name)
        ) {
          if (analytics.referrers && click.referrer) {
            analytics.referrers[click.referrer] =
              (analytics.referrers[click.referrer] || 0) + 1;
          }
          if (analytics.utmSources && click.utmSource) {
            analytics.utmSources[click.utmSource] =
              (analytics.utmSources[click.utmSource] || 0) + 1;
          }
          if (analytics.devices && click.deviceModel) {
            analytics.devices[click.deviceModel] =
              (analytics.devices[click.deviceModel] || 0) + 1;
          }
        }
      }
    });

    return analytics;
  }

  async getClickEvents(userId: string, linkId: string): Promise<ClickEvent[]> {
    const link = await this.linkRepository.findOne({
      where: { id: linkId, user: { id: userId } },
      relations: ['clickEvents'],
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    return link.clickEvents;
  }
}
