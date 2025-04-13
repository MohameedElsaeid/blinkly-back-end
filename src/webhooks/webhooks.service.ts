import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import {
  WebhookEndpoint,
  WebhookEventType,
} from '../entities/webhook-endpoint.entity';
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
    try {
      const webhook = this.webhookEndpointRepository.create({
        ...createWebhookDto,
        secret: nanoid(32),
        user: { id: userId },
      });

      return await this.webhookEndpointRepository.save(webhook);
    } catch (error) {
      this.logger.error(
        `Failed to create webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async getWebhooks(userId: string): Promise<WebhookEndpoint[]> {
    try {
      return await this.webhookEndpointRepository.find({
        where: { user: { id: userId } },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get webhooks: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async deleteWebhook(userId: string, webhookId: string): Promise<void> {
    try {
      const webhook = await this.webhookEndpointRepository.findOne({
        where: { id: webhookId, user: { id: userId } },
      });

      if (!webhook) {
        throw new NotFoundException('Webhook not found');
      }

      await this.webhookEndpointRepository.remove(webhook);
    } catch (error) {
      this.logger.error(
        `Failed to delete webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async triggerWebhook(
    userId: string,
    event: WebhookEventType,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      const webhooks = await this.webhookEndpointRepository.find({
        where: {
          user: { id: userId },
          isActive: true,
          events: event,
        },
      });

      await Promise.all(
        webhooks.map(async (webhook) => {
          try {
            const signature = this.generateSignature(webhook.secret, payload);
            const response = await fetch(webhook.url, {
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

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
          } catch (error) {
            this.logger.error(
              `Failed to trigger webhook ${webhook.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );

            webhook.failedAttempts += 1;
            webhook.lastFailedAt = new Date();
            await this.webhookEndpointRepository.save(webhook);
          }
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to trigger webhooks: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  private generateSignature(
    secret: string,
    payload: Record<string, unknown>,
  ): string {
    const data = JSON.stringify(payload);
    return createHmac('sha256', secret).update(data).digest('hex');
  }
}
