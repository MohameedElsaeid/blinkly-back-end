import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { IAuthenticatedRequest } from '../interfaces/request.interface';
import { WebhookEndpoint } from '../entities/webhook-endpoint.entity';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createWebhook(
    @Req() req: IAuthenticatedRequest,
    @Body() createWebhookDto: CreateWebhookDto,
  ): Promise<WebhookEndpoint> {
    return this.webhooksService.createWebhook(req.user.id, createWebhookDto);
  }

  @Get()
  async getWebhooks(
    @Req() req: IAuthenticatedRequest,
  ): Promise<WebhookEndpoint[]> {
    return this.webhooksService.getWebhooks(req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWebhook(
    @Req() req: IAuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.webhooksService.deleteWebhook(req.user.id, id);
  }
}
