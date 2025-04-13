import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { customAlphabet } from 'nanoid';
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

interface IAnalyticsResponse {
  totalClicks: number;
  clicksByDate: Record<string, number>;
  browsers?: Record<string, number>;
  operatingSystems?: Record<string, number>;
  countries?: Record<string, number>;
  referrers?: Record<string, number>;
  utmSources?: Record<string, number>;
  devices?: Record<string, number>;
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
    try {
      const user = await this.validateUserAndSubscription(userId);

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
      await this.validateAlias(alias);

      const link = this.linkRepository.create({
        ...createLinkDto,
        alias,
        user,
        redirectType: createLinkDto.redirectType || RedirectType.TEMPORARY,
      });

      return await this.linkRepository.save(link);
    } catch (error) {
      this.handleError(error, 'Failed to create link');
      throw error;
    }
  }

  async createDynamicLink(
    userId: string,
    createDynamicLinkDto: CreateDynamicLinkDto,
  ): Promise<DynamicLink> {
    try {
      const user = await this.validateUserAndSubscription(userId);

      if (user.activeSubscription.plan.name === PlanName.FREE) {
        throw new BadRequestException(
          'Dynamic links require a paid subscription',
        );
      }

      await this.validateAlias(createDynamicLinkDto.alias);

      const dynamicLink = this.dynamicLinkRepository.create({
        ...createDynamicLinkDto,
        user,
      });

      return await this.dynamicLinkRepository.save(dynamicLink);
    } catch (error) {
      this.handleError(error, 'Failed to create dynamic link');
      throw error;
    }
  }

  async getAnalytics(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<IAnalyticsResponse> {
    try {
      const user = await this.validateUserAndSubscription(userId);

      const queryBuilder = this.clickEventRepository
        .createQueryBuilder('click')
        .innerJoin('click.link', 'link')
        .where('link.userId = :userId', { userId });

      if (startDate && endDate) {
        queryBuilder.andWhere(
          'click.timestamp BETWEEN :startDate AND :endDate',
          {
            startDate,
            endDate,
          },
        );
      }

      const clicks = await queryBuilder.getMany();
      return this.processAnalytics(clicks, user);
    } catch (error) {
      this.handleError(error, 'Failed to get analytics');
      throw error;
    }
  }

  async getClickEvents(userId: string, linkId: string): Promise<ClickEvent[]> {
    try {
      const link = await this.linkRepository.findOne({
        where: { id: linkId, user: { id: userId } },
        relations: ['clickEvents'],
      });

      if (!link) {
        throw new NotFoundException('Link not found');
      }

      return link.clickEvents;
    } catch (error) {
      this.handleError(error, 'Failed to get click events');
      throw error;
    }
  }

  async getDynamicLinkClickEvents(
    userId: string,
    linkId: string,
  ): Promise<DynamicLinkClickEvent[]> {
    try {
      const dynamicLink = await this.dynamicLinkRepository.findOne({
        where: { id: linkId, user: { id: userId } },
        relations: ['clickEvents'],
      });

      if (!dynamicLink) {
        throw new NotFoundException('Dynamic link not found');
      }

      return dynamicLink.clickEvents;
    } catch (error) {
      this.handleError(error, 'Failed to get dynamic link click events');
      throw error;
    }
  }

  async deleteLink(userId: string, linkId: string): Promise<void> {
    try {
      const link = await this.linkRepository.findOne({
        where: { id: linkId, user: { id: userId } },
      });

      if (!link) {
        throw new NotFoundException('Link not found');
      }

      await this.linkRepository.remove(link);
    } catch (error) {
      this.handleError(error, 'Failed to delete link');
      throw error;
    }
  }

  async deleteDynamicLink(userId: string, linkId: string): Promise<void> {
    try {
      const dynamicLink = await this.dynamicLinkRepository.findOne({
        where: { id: linkId, user: { id: userId } },
      });

      if (!dynamicLink) {
        throw new NotFoundException('Dynamic link not found');
      }

      await this.dynamicLinkRepository.remove(dynamicLink);
    } catch (error) {
      this.handleError(error, 'Failed to delete dynamic link');
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

    if (
      !user.activeSubscription ||
      user.activeSubscription.status !== 'active'
    ) {
      throw new BadRequestException('Active subscription required');
    }

    return user;
  }

  private async validateAlias(alias: string): Promise<void> {
    const existingLink = await this.linkRepository.findOne({
      where: { alias },
    });

    if (existingLink) {
      throw new BadRequestException('Alias already exists');
    }
  }

  private processAnalytics(
    clicks: ClickEvent[],
    user: User,
  ): IAnalyticsResponse {
    const analytics: IAnalyticsResponse = {
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

    for (const click of clicks) {
      this.processClickAnalytics(click, analytics, user);
    }

    return analytics;
  }

  private processClickAnalytics(
    click: ClickEvent,
    analytics: IAnalyticsResponse,
    user: User,
  ): void {
    const date = click.timestamp.toISOString().split('T')[0];
    analytics.clicksByDate[date] = (analytics.clicksByDate[date] || 0) + 1;

    if (user.activeSubscription?.plan.name !== PlanName.FREE) {
      this.processBasicAnalytics(click, analytics);

      const advancedPlans = [
        PlanName.PROFESSIONAL,
        PlanName.BUSINESS,
        PlanName.ENTERPRISE,
      ];

      if (
        user.activeSubscription?.plan.name &&
        advancedPlans.includes(user.activeSubscription.plan.name)
      ) {
        this.processAdvancedAnalytics(click, analytics);
      }
    }
  }

  private processBasicAnalytics(
    click: ClickEvent,
    analytics: IAnalyticsResponse,
  ): void {
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
  }

  private processAdvancedAnalytics(
    click: ClickEvent,
    analytics: IAnalyticsResponse,
  ): void {
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

  private handleError(error: unknown, message: string): void {
    if (error instanceof Error) {
      this.logger.error(`${message}: ${error.message}`, error.stack);
      if (
        !(
          error instanceof BadRequestException ||
          error instanceof NotFoundException
        )
      ) {
        throw new InternalServerErrorException(message);
      }
    } else {
      this.logger.error(`${message}: Unknown error`);
      throw new InternalServerErrorException(message);
    }
  }
}
