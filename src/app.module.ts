import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import redisStore from 'cache-manager-redis-store';
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
import { QrCode } from './entities/qr-code.entity';
import { WebhookEndpoint } from './entities/webhook-endpoint.entity';
import configuration from './config/configuration';
import { validationSchema } from './config/env.validation';
import { Plan } from './entities/plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { PackagesModule } from './packages/packages.module';
import { PaymentsModule } from './payments/payments.module';
import { RedirectModule } from './redirect/redirect.service';

const redisStoreFactory: any = redisStore;

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : '.env.development',
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
        // Include your entities
        entities: [
          User,
          Link,
          DynamicLink,
          ClickEvent,
          DynamicLinkClickEvent,
          QrCode,
          WebhookEndpoint,
          Plan,
          UserSubscription,
          WebhookEndpoint,
        ],
        // Add the migrations property with a proper glob path to your compiled migration files.
        // Adjust the path based on your build output.
        migrations: [__dirname + '/../migrations/*.js'],
        // Optionally, you can set migrationsRun: true to automatically run pending migrations on app startup.
        // migrationsRun: true,
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: configService.get<boolean>('database.logging'),
        // Enable SSL with rejection disabled (if DATABASE_SSL is true).
        ssl: configService.get<boolean>('database.ssl')
          ? { rejectUnauthorized: false }
          : false,
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
    PackagesModule,
    PaymentsModule,
    RedirectModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  // Optionally, inject DataSource for manual usage if needed.
  // constructor(private dataSource: DataSource) {}
}
