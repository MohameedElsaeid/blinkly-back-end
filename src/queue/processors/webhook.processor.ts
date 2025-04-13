import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import * as crypto from 'crypto';

interface IWebhookJobData {
  url: string;
  payload: Record<string, unknown>;
  secret: string;
}

@Processor('webhooks')
export class WebhookProcessor {
  private readonly logger = new Logger(WebhookProcessor.name);

  @Process('send')
  async handleWebhook(job: Job<IWebhookJobData>): Promise<void> {
    try {
      this.logger.debug(`Processing webhook job ${job.id}`);
      const { url, payload, secret } = job.data;

      const signature = this.generateSignature(secret, payload);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
        },
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }

      this.logger.debug(`Completed webhook job ${job.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process webhook job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  private generateSignature(secret: string, payload: Record<string, unknown>): string {
    const data = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }
}