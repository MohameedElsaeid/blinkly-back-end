import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedirectController } from './redirect.controller';
import { Link } from '../entities/link.entity';
import { DynamicLink } from '../entities/dynamic-link.entity';
import { AnalyticsModule } from '../analytics/analytics.module';
import { RedirectService } from './redirect.module';

@Module({
  imports: [TypeOrmModule.forFeature([Link, DynamicLink]), AnalyticsModule],
  controllers: [RedirectController],
  providers: [RedirectService],
  exports: [RedirectService],
})
export class RedirectModule {}
