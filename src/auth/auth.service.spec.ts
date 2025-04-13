import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('signUp', () => {
    const signUpDto: SignUpDto = {
      email: 'test@example.com',
      password: 'Password123!',
      passwordConfirmation: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      countryCode: '+1',
      phoneNumber: '1234567890',
      country: 'US',
    };

    it('should successfully create a new user', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser as User);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser as User);

      const result = await service.signUp(signUpDto);

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe(mockUser.email);
      expect(result.data?.token).toBeDefined();
    });

    it('should throw ConflictException if user already exists', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);

      await expect(service.signUp(signUpDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should successfully login a user', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        ...mockUser,
        validatePassword: () => Promise.resolve(true),
      } as unknown as User);

      const result = await service.login(loginDto);

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe(mockUser.email);
      expect(result.data?.token).toBeDefined();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
