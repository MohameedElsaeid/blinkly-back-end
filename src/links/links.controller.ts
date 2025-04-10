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
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { IAuthenticatedRequest } from '@/interfaces/request.interface';
import { Link } from '@/entities/link.entity';
import { DynamicLink } from '@/entities/dynamic-link.entity';
import { ClickEvent } from '@/entities/click-event.entity';

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

@Controller('api')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post('links')
  @HttpCode(HttpStatus.CREATED)
  async createLink(
    @Req() req: IAuthenticatedRequest,
    @Body() createLinkDto: CreateLinkDto,
  ): Promise<Link> {
    return await this.linksService.createLink(req.user.id, createLinkDto);
  }

  @Post('dynamic-links')
  @HttpCode(HttpStatus.CREATED)
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
  async getLinkClicks(
    @Req() req: IAuthenticatedRequest,
    @Param('id') linkId: string,
  ): Promise<ClickEvent[]> {
    return await this.linksService.getClickEvents(req.user.id, linkId);
  }
}
