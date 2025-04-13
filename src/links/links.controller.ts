import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LinksService } from './links.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { CreateDynamicLinkDto } from './dto/create-dynamic-link.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { IAuthenticatedRequest } from '../interfaces/request.interface';
import { Link } from '../entities/link.entity';
import { DynamicLink } from '../entities/dynamic-link.entity';
import { ClickEvent } from '../entities/click-event.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

interface AnalyticsResponse {
  totalClicks: number;
  clicksByDate: Record<string, number>;
  browsers?: Record<string, number>;
  operatingSystems?: Record<string, number>;
  countries?: Record<string, number>;
  referrers?: Record<string, number>;
  utmSources?: Record<string, number>;
  devices?: Record<string, number>;
}

@ApiTags('Links')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@Controller('api')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post('links')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a short link' })
  @ApiBody({ type: CreateLinkDto })
  @ApiResponse({
    status: 201,
    description: 'Link successfully created',
    type: Link,
  })
  async createLink(
    @Req() req: IAuthenticatedRequest,
    @Body() createLinkDto: CreateLinkDto,
  ): Promise<Link> {
    return await this.linksService.createLink(req.user.id, createLinkDto);
  }

  @Post('dynamic-links')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a dynamic link' })
  @ApiBody({ type: CreateDynamicLinkDto })
  @ApiResponse({
    status: 201,
    description: 'Dynamic link successfully created',
    type: DynamicLink,
  })
  async createDynamicLink(
    @Req() req: IAuthenticatedRequest,
    @Body() createDynamicLinkDto: CreateDynamicLinkDto,
  ): Promise<DynamicLink> {
    return await this.linksService.createDynamicLink(
      req.user.id,
      createDynamicLinkDto,
    );
  }

  @Get('links/analytics')
  @ApiOperation({ summary: 'Get link analytics within a date range' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date in ISO format',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date in ISO format',
  })
  @ApiResponse({
    status: 200,
    description: 'Aggregated analytics data',
    schema: {
      example: {
        totalClicks: 124,
        clicksByDate: { '2025-04-01': 12, '2025-04-02': 34 },
        browsers: { Chrome: 55, Safari: 20 },
        operatingSystems: { Windows: 50, macOS: 25 },
        countries: { US: 40, EG: 30 },
        referrers: { Google: 22, Facebook: 10 },
        utmSources: { google: 40, facebook: 10 },
        devices: { Mobile: 70, Desktop: 30 },
      },
    },
  })
  async getAnalytics(
    @Req() req: IAuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AnalyticsResponse> {
    try {
      return await this.linksService.getAnalytics(
        req.user.id,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  @Get('links/:id/clicks')
  @ApiOperation({ summary: 'Get click events for a specific link' })
  @ApiParam({ name: 'id', description: 'The ID of the link' })
  @ApiResponse({
    status: 200,
    description: 'List of click events for the link',
    type: [ClickEvent],
  })
  async getLinkClicks(
    @Req() req: IAuthenticatedRequest,
    @Param('id') linkId: string,
  ): Promise<ClickEvent[]> {
    return await this.linksService.getClickEvents(req.user.id, linkId);
  }
}
