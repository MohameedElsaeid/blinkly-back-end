//app.modules.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import redisStore from 'cache-manager-redis-store';
import { AuthModule } from './auth/auth.module';
import { LinksModule } from './links/links.module';
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
import { RedirectModule } from './redirect/redirect.module';
import { VisitorModule } from './visitor/visitor.module';
import { Visit } from './entities/visit.entity';
import { DashboardModule } from './dashboard/dashboard.module';
import { UserDevice } from './entities/user-device.entity';
import { VisitorTrackingMiddleware } from './middleware/visitor-tracking.middleware';
import { UsersModule } from './users/users.module';
import { AnalyticsModule } from './analytics/analytics.module';

const redisStoreFactory: any = redisStore;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        schema: process.env.DATABASE_SCHEMA || 'public',
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
          Visit,
          UserDevice,
        ],
        migrations: [__dirname + '/../migrations/*.js'],
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: false,
        ssl:
          process.env.DATABASE_SSL === 'true'
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
    QrModule,
    WebhooksModule,
    QueueModule,
    PackagesModule,
    PaymentsModule,
    RedirectModule,
    VisitorModule,
    DashboardModule,
    UsersModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [VisitorTrackingMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(VisitorTrackingMiddleware).forRoutes('*');
  }
}
