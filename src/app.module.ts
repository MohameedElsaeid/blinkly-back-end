import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import redisStore from 'cache-manager-redis-store';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { LinksModule } from './links/links.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { QrModule } from './qr/qr.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { QueueModule } from './queue/queue.module';
import { User } from './entities/user.entity';
import { Link } from './entities/link.entity';
import { DynamicLink } from './entities/dynamic-link.entity';
import { ClickEvent } from './entities/click-event.entity';
import { DynamicLinkClickEvent } from './entities/dynamic-link-click-event.entity';
import { QrCode } from './qr/entities/qr-code.entity';
import { WebhookEndpoint } from './webhooks/entities/webhook-endpoint.entity';
import configuration from './config/configuration';
import { validationSchema } from './config/env.validation';

// Workaround for redisStore type issues: cast to a safe type.
const redisStoreFactory: any = redisStore;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [
          User,
          Link,
          DynamicLink,
          ClickEvent,
          DynamicLinkClickEvent,
          QrCode,
          WebhookEndpoint,
        ],
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: configService.get<boolean>('database.logging'),
        ssl: configService.get<boolean>('database.ssl'),
        poolSize: 20,
        extra: {
          max: 20,
          connectionTimeoutMillis: 10000,
        },
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: redisStoreFactory,
        host: configService.get<string>('redis.host'),
        port: configService.get<number>('redis.port'),
        ttl: 300,
        max: 100,
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      },
      {
        ttl: 3600,
        limit: 1000,
      },
    ]),
    AuthModule,
    LinksModule,
    AnalyticsModule,
    QrModule,
    WebhooksModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
