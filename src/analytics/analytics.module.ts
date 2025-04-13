import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ClickEvent } from '../entities/click-event.entity';
import { DynamicLinkClickEvent } from '../entities/dynamic-link-click-event.entity';
import { Link } from '../entities/link.entity';
import { DynamicLink } from '../entities/dynamic-link.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClickEvent,
      DynamicLinkClickEvent,
      Link,
      DynamicLink,
      User,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
