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

interface IPaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
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

  async getUserLinks(userId: string, options: IPaginationOptions) {
    try {
      const [links, total] = await this.linkRepository.findAndCount({
        where: { user: { id: userId } },
        relations: ['clickEvents'],
        order: { [options.sortBy]: options.sortOrder },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      });

      return {
        links,
        pagination: {
          total,
          page: options.page,
          limit: options.limit,
          totalPages: Math.ceil(total / options.limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get user links: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve links');
    }
  }

  private calculateClicksByMetric(
    clicks: ClickEvent[],
    metric: keyof ClickEvent,
  ): Record<string, number> {
    return clicks.reduce(
      (acc, click) => {
        const value = (click[metric] as string) || 'Unknown';
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
