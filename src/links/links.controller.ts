import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetLinksDto } from './dto/get-links.dto';
import { ILinkAnalytics } from '../interfaces/analytics.interface';

@ApiTags('Links')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@Controller('api')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Get('links')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all links with pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of links with pagination info',
  })
  async getLinks(
    @Req() req: IAuthenticatedRequest,
    @Query() query: GetLinksDto,
  ) {
    return await this.linksService.getLinks(req.user.id, query);
  }

  @Get('links/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get link by ID with detailed analytics' })
  @ApiResponse({
    status: 200,
    description: 'Link details with analytics',
  })
  async getLinkById(
    @Req() req: IAuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{
    id: string;
    originalUrl: string;
    alias: string;
    isActive: boolean;
    tags: string[];
    clickCount: number;
    redirectType: number;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    analytics: ILinkAnalytics;
  }> {
    return await this.linksService.getLinkById(req.user.id, id);
  }

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
}
