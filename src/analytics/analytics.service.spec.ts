import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsService } from './analytics.service';
import { ClickEvent } from '../entities/click-event.entity';
import { DynamicLinkClickEvent } from '../entities/dynamic-link-click-event.entity';
import { Link } from '../entities/link.entity';
import { DynamicLink } from '../entities/dynamic-link.entity';
import { User } from '../entities/user.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let clickEventRepository: Repository<ClickEvent>;
  let linkRepository: Repository<Link>;
  let userRepository: Repository<User>;

  const mockUser = {
    id: '1',
    activeSubscription: {
      plan: {
        name: 'PROFESSIONAL',
      },
      status: 'active',
    },
  };

  const mockLink = {
    id: '1',
    alias: 'test123',
    user: mockUser,
    isActive: true,
    clickCount: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(ClickEvent),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              innerJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              getRawMany: jest.fn().mockResolvedValue([]),
            })),
          },
        },
        {
          provide: getRepositoryToken(DynamicLinkClickEvent),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Link),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockLink),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DynamicLink),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    clickEventRepository = module.get<Repository<ClickEvent>>(
      getRepositoryToken(ClickEvent),
    );
    linkRepository = module.get<Repository<Link>>(getRepositoryToken(Link));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('recordClickForLink', () => {
    const clickData = {
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      referrer: 'https://example.com',
    };

    it('should record a click event successfully', async () => {
      const result = await service.recordClickForLink('test123', clickData);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for non-existent link', async () => {
      jest.spyOn(linkRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.recordClickForLink('nonexistent', clickData),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for inactive link', async () => {
      jest.spyOn(linkRepository, 'findOne').mockResolvedValue({
        ...mockLink,
        isActive: false,
      });

      await expect(
        service.recordClickForLink('test123', clickData),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAnalyticsOverview', () => {
    it('should return analytics overview for user', async () => {
      jest.spyOn(clickEventRepository, 'count').mockResolvedValue(10);

      const result = await service.getAnalyticsOverview(mockUser.id);
      expect(result.totalClicks).toBeDefined();
    });

    it('should throw NotFoundException for non-existent user', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getAnalyticsOverview('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
