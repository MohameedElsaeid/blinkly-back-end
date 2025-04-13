import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { IAuthenticatedRequest } from '../interfaces/request.interface';
import {
  IAnalyticsOverview,
  IClickData,
  IClicksByMetric,
  IDateRangeAnalytics,
  ILinkAnalytics,
} from '../interfaces/analytics.interface';
import { ClickEvent } from '../entities/click-event.entity';
import { DynamicLinkClickEvent } from '../entities/dynamic-link-click-event.entity';

@Controller('analytics')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('link/:alias/click')
  @HttpCode(HttpStatus.CREATED)
  async recordClickForLink(
    @Param('alias') alias: string,
    @Body() clickData: IClickData,
  ): Promise<ClickEvent> {
    return this.analyticsService.recordClickForLink(alias, clickData);
  }

  @Post('dynamic/:alias/click')
  @HttpCode(HttpStatus.CREATED)
  async recordClickForDynamicLink(
    @Param('alias') alias: string,
    @Body() clickData: Record<string, unknown>,
  ): Promise<DynamicLinkClickEvent> {
    return this.analyticsService.recordClickForDynamicLink(alias, clickData);
  }

  @Get('link/:id')
  async getLinkAnalytics(
    @Req() req: IAuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ILinkAnalytics> {
    return this.analyticsService.getLinkAnalytics(req.user.id, id);
  }

  @Get('link/:id/date-range')
  async getLinkAnalyticsByDateRange(
    @Req() req: IAuthenticatedRequest,
    @Param('id') id: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ): Promise<IDateRangeAnalytics> {
    return this.analyticsService.getLinkAnalyticsByDateRange(
      req.user.id,
      id,
      start,
      end,
    );
  }

  @Get('overview')
  async getAnalyticsOverview(
    @Req() req: IAuthenticatedRequest,
  ): Promise<IAnalyticsOverview> {
    return this.analyticsService.getAnalyticsOverview(req.user.id);
  }

  @Get('devices')
  async getClicksByDevice(
    @Req() req: IAuthenticatedRequest,
  ): Promise<IClicksByMetric> {
    return this.analyticsService.getClicksByDevice(req.user.id);
  }

  @Get('browsers')
  async getClicksByBrowser(
    @Req() req: IAuthenticatedRequest,
  ): Promise<IClicksByMetric> {
    return this.analyticsService.getClicksByBrowser(req.user.id);
  }

  @Get('countries')
  async getClicksByCountry(
    @Req() req: IAuthenticatedRequest,
  ): Promise<IClicksByMetric> {
    return this.analyticsService.getClicksByCountry(req.user.id);
  }
}
