import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import {
  WebhookEndpoint,
  WebhookEventType,
} from './entities/webhook-endpoint.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { nanoid } from 'nanoid';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(WebhookEndpoint)
    private readonly webhookEndpointRepository: Repository<WebhookEndpoint>,
  ) {}

  async createWebhook(
    userId: string,
    createWebhookDto: CreateWebhookDto,
  ): Promise<WebhookEndpoint> {
    const webhook = this.webhookEndpointRepository.create({
      ...createWebhookDto,
      secret: nanoid(32),
      user: { id: userId },
    });

    return await this.webhookEndpointRepository.save(webhook);
  }

  async triggerWebhook(
    userId: string,
    event: WebhookEventType,
    payload: unknown,
  ): Promise<void> {
    const webhooks = await this.webhookEndpointRepository.find({
      where: {
        user: { id: userId },
        isActive: true,
        events: event,
      },
    });

    for (const webhook of webhooks) {
      try {
        const signature = this.generateSignature(webhook.secret, payload);

        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
          },
          body: JSON.stringify({
            event,
            payload,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        this.logger.error(
          `Failed to trigger webhook ${webhook.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );

        webhook.failedAttempts += 1;
        webhook.lastFailedAt = new Date();
        await this.webhookEndpointRepository.save(webhook);
      }
    }
  }

  private generateSignature(secret: string, payload: unknown): string {
    const data = JSON.stringify(payload);
    return createHmac('sha256', secret).update(data).digest('hex');
  }
}
