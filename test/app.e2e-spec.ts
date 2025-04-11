import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../src/entities/user.entity';
import * as bcrypt from 'bcrypt';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('database.host'),
            port: configService.get('database.port'),
            username: configService.get('database.username'),
            password: configService.get('database.password'),
            database: configService.get('database.name'),
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: true,
          }),
          inject: [ConfigService],
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  describe('Auth', () => {
    const signUpDto = {
      email: 'test@example.com',
      password: 'Password123!',
      passwordConfirmation: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      countryCode: '+1',
      phoneNumber: '1234567890',
      country: 'US',
    };

    it('/auth/signup (POST)', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(signUpDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.email).toBe(signUpDto.email);
          expect(res.body.data.token).toBeDefined();
          accessToken = res.body.data.token;
        });
    });

    it('/auth/login (POST)', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: signUpDto.email,
          password: signUpDto.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.email).toBe(signUpDto.email);
          expect(res.body.data.token).toBeDefined();
        });
    });
  });

  describe('Links', () => {
    const createLinkDto = {
      originalUrl: 'https://example.com',
      alias: 'test123',
    };

    it('/links (POST)', () => {
      return request(app.getHttpServer())
        .post('/links')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createLinkDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.originalUrl).toBe(createLinkDto.originalUrl);
          expect(res.body.alias).toBe(createLinkDto.alias);
        });
    });

    it('/links/analytics (GET)', () => {
      return request(app.getHttpServer())
        .get('/links/analytics')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.totalClicks).toBeDefined();
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
