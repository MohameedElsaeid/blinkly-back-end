import {
  Controller,
  Get,
  Headers,
  HttpStatus,
  InternalServerErrorException,
  Ip,
  NotFoundException,
  Param,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { RedirectService } from './redirect.module';
import { RedirectResponse } from './interfaces/redirect.interface';

@ApiTags('Redirect')
@Controller()
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) {}

  @Get(':alias')
  @ApiOperation({ summary: 'Redirect to the original URL' })
  @ApiParam({
    name: 'alias',
    description: 'The alias of the shortened URL',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.MOVED_PERMANENTLY,
    description: 'Permanent redirect to the original URL',
  })
  @ApiResponse({
    status: HttpStatus.TEMPORARY_REDIRECT,
    description: 'Temporary redirect to the original URL',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Link not found or expired',
  })
  async handleRedirect(
    @Param('alias') alias: string,
    @Ip() ip: string,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ): Promise<RedirectResponse | undefined> {
    try {
      return await this.redirectService.handleRedirect(
        alias,
        {
          ipAddress: ip,
          userAgent: headers['user-agent'],
          referrer: headers['referer'],
          utmSource: req.query.utm_source as string,
          utmMedium: req.query.utm_medium as string,
          utmCampaign: req.query.utm_campaign as string,
          utmTerm: req.query.utm_term as string,
          utmContent: req.query.utm_content as string,
        },
        req,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Link not found or expired');
      } else {
        throw new InternalServerErrorException('Error processing redirect');
      }
    }
  }
}
