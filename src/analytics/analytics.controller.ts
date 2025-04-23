import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { IAuthenticatedRequest } from '../interfaces/request.interface';
import { AnalyticsDashboardResponse } from './interfaces/analytics.interface';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get analytics dashboard metrics' })
  @ApiResponse({
    status: 200,
    description: 'Returns comprehensive analytics dashboard data',
    type: Object,
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to analyze (default: 30)',
  })
  async getDashboardMetrics(
    @Req() req: IAuthenticatedRequest,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ): Promise<AnalyticsDashboardResponse> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 86400000);

    return this.analyticsService.getDashboardMetrics(
      req.user.id,
      startDate,
      endDate,
    );
  }
}
