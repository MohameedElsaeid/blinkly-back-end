import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { AnalyticsProcessor } from './processors/analytics.processor';
import { WebhookProcessor } from './processors/webhook.processor';
import { EmailProcessor } from './processors/email.processor';
import { ClickEvent } from '../entities/click-event.entity';
import { Link } from '../entities/link.entity';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'analytics' },
      { name: 'webhooks' },
      { name: 'emails' },
    ),
    TypeOrmModule.forFeature([ClickEvent, Link]),
  ],
  providers: [
    QueueService,
    AnalyticsProcessor,
    WebhookProcessor,
    EmailProcessor,
  ],
  exports: [QueueService],
})
export class QueueModule {}
