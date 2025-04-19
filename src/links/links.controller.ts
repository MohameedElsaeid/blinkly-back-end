import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
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
}
