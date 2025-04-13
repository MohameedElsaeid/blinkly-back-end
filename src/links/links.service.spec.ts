import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LinksService } from './links.service';
import { Link } from '../entities/link.entity';
import { DynamicLink } from '../entities/dynamic-link.entity';
import { User } from '../entities/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('LinksService', () => {
  let service: LinksService;
  let linkRepository: Repository<Link>;
  let userRepository: Repository<User>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    activeSubscription: {
      plan: {
        shortenedLinksLimit: 100,
        name: 'BASIC',
      },
      status: 'active',
    },
  };

  const mockLink = {
    id: '1',
    originalUrl: 'https://example.com',
    alias: 'test123',
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinksService,
        {
          provide: getRepositoryToken(Link),
          useValue: {
            create: jest.fn().mockReturnValue(mockLink),
            save: jest.fn().mockResolvedValue(mockLink),
            findOne: jest.fn().mockResolvedValue(mockLink),
            count: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockUser),
          },
        },
        {
          provide: getRepositoryToken(DynamicLink),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LinksService>(LinksService);
    linkRepository = module.get<Repository<Link>>(getRepositoryToken(Link));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLink', () => {
    it('should create a new link successfully', async () => {
      const createLinkDto = {
        originalUrl: 'https://example.com',
        alias: 'test123',
      };

      const result = await service.createLink(mockUser.id, createLinkDto);
      expect(result).toEqual(mockLink);
    });

    it('should throw BadRequestException when user has reached link limit', async () => {
      jest.spyOn(linkRepository, 'count').mockResolvedValue(100);

      const createLinkDto = {
        originalUrl: 'https://example.com',
        alias: 'test123',
      };

      await expect(
        service.createLink(mockUser.id, createLinkDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user is not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const createLinkDto = {
        originalUrl: 'https://example.com',
        alias: 'test123',
      };

      await expect(
        service.createLink('nonexistent', createLinkDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
