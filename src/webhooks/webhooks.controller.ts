import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  async createWebhook(@Req() req, @Body() createWebhookDto: CreateWebhookDto) {
    return this.webhooksService.createWebhook(req.user.id, createWebhookDto);
  }
}
