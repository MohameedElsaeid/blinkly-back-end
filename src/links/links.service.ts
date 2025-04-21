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
import { GetLinksDto } from './dto/get-links.dto';
import { ILinkAnalytics } from '../interfaces/analytics.interface';

const nanoid = customAlphabet(
  '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  8,
);

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

  async getLinks(userId: string, query: GetLinksDto) {
    try {
      const [links, total] = await this.linkRepository.findAndCount({
        where: { user: { id: userId } },
        relations: ['clickEvents', 'clickEvents.userDevice'],
        order: {
          [query.sortBy]: query.sortOrder,
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      });

      const linksWithAnalytics = await Promise.all(
        links.map(async (link) => {
          const analytics = await this.getDetailedAnalytics(link);
          return {
            id: link.id,
            originalUrl: link.originalUrl,
            alias: link.alias,
            isActive: link.isActive,
            tags: link.tags,
            clickCount: link.clickCount,
            redirectType: link.redirectType,
            expiresAt: link.expiresAt,
            createdAt: link.createdAt,
            updatedAt: link.updatedAt,
            analytics,
          };
        }),
      );

      return {
        links: linksWithAnalytics,
        pagination: {
          total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(total / query.limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get links: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve links');
    }
  }

  async getLinkById(userId: string, linkId: string) {
    try {
      const link = await this.linkRepository.findOne({
        where: { id: linkId, user: { id: userId } },
        relations: ['clickEvents', 'clickEvents.userDevice'],
      });

      if (!link) {
        throw new NotFoundException('Link not found');
      }

      const analytics = await this.getDetailedAnalytics(link);

      return {
        ...link,
        analytics,
      };
    } catch (error) {
      this.logger.error(`Failed to get link: ${error.message}`);
      throw error;
    }
  }

  private async getDetailedAnalytics(link: Link): Promise<ILinkAnalytics> {
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
        expiresAt: createLinkDto.expiresAt || null,
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
