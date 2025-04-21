import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ClickPerformanceMetrics,
  DashboardAnalytics,
  DeviceAnalytics,
  GeographicAnalytics,
  IDashboardTip,
  ITopLink,
  ITotalClicksResponse,
  TopReferrersResponse,
} from './dashboard.interface';
import { CacheInterceptor } from '@nestjs/cache-manager';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('total-clicks')
  async getTotalClicks(
    @GetUser('id') userId: string,
  ): Promise<ITotalClicksResponse> {
    return this.dashboardService.getTotalClicks(userId);
  }

  @Get('top-links')
  async getTopLinks(
    @GetUser('id') userId: string,
  ): Promise<{ links: ITopLink[] }> {
    const links = await this.dashboardService.getTopLinks(userId);
    return { links };
  }

  @Get('tips')
  getDashboardTips(): {
    tips: IDashboardTip[];
  } {
    return { tips: this.dashboardService.getDashboardTips() };
  }

  @Get('tricks')
  getDashboardTricks(): { tricks: string[] } {
    return { tricks: this.dashboardService.getDashboardTricks() };
  }

  @Get('analytics')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get dashboard analytics metrics' })
  @ApiResponse({
    status: 200,
    description: 'Returns analytics metrics for the dashboard',
  })
  async getDashboardAnalytics(
    @GetUser('id') userId: string,
  ): Promise<DashboardAnalytics> {
    return this.dashboardService.getDashboardAnalytics(userId);
  }

  @Get('device-distribution')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get device usage distribution' })
  @ApiResponse({
    status: 200,
    description: 'Returns device usage distribution analytics',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to analyze (default: 30)',
  })
  async getDeviceDistribution(
    @GetUser('id') userId: string,
    @Query('days') days = 30,
  ): Promise<DeviceAnalytics> {
    return this.dashboardService.getDeviceDistribution(userId, days);
  }

  @Get('geographic-distribution')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get geographic distribution of clicks' })
  @ApiResponse({
    status: 200,
    description: 'Returns geographic distribution analytics',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to analyze (default: 30)',
  })
  async getGeographicDistribution(
    @GetUser('id') userId: string,
    @Query('days') days = 30,
  ): Promise<GeographicAnalytics> {
    return this.dashboardService.getGeographicDistribution(userId, days);
  }

  @Get('top-referrers')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get top referral sources analytics' })
  @ApiResponse({
    status: 200,
    description: 'Returns top referral sources with analytics data',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    description: 'Start date in ISO format (default: 30 days ago)',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    description: 'End date in ISO format (default: now)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of results to return (default: 10, max: 50)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    type: String,
    description: 'Sort field (visits, revenue, conversion_rate)',
  })
  async getTopReferrers(
    @GetUser('id') userId: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('sort_by') sortBy?: 'visits' | 'revenue' | 'conversion_rate',
  ): Promise<TopReferrersResponse> {
    return this.dashboardService.getTopReferrers(userId, {
      startDate,
      endDate,
      limit: Math.min(limit || 10, 50),
      page: page || 1,
      sortBy,
    });
  }

  @Get('click-performance')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get click performance metrics' })
  @ApiResponse({
    status: 200,
    description: 'Returns click performance metrics with daily aggregation',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    description: 'Start date in ISO format (default: 30 days ago)',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    description: 'End date in ISO format (default: now)',
  })
  @ApiQuery({
    name: 'metric',
    required: false,
    type: String,
    description: 'Metric type (clicks or visitors)',
  })
  async getClickPerformance(
    @GetUser('id') userId: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('metric') metric: 'clicks' | 'visitors' = 'clicks',
  ): Promise<ClickPerformanceMetrics> {
    return this.dashboardService.getClickPerformance(userId, {
      startDate,
      endDate,
      metric,
    });
  }
}
