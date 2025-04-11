import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, JobOptions } from 'bull';

interface IQueueData {
  [key: string]: unknown;
}

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('analytics') private readonly analyticsQueue: Queue,
    @InjectQueue('webhooks') private readonly webhooksQueue: Queue,
    @InjectQueue('emails') private readonly emailsQueue: Queue,
  ) {}

  async processAnalytics(data: IQueueData): Promise<void> {
    const options: JobOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    };
    await this.analyticsQueue.add('process', data, options);
  }

  async sendWebhook(data: IQueueData): Promise<void> {
    const options: JobOptions = {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    };
    await this.webhooksQueue.add('send', data, options);
  }

  async sendEmail(data: IQueueData): Promise<void> {
    const options: JobOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    };
    await this.emailsQueue.add('send', data, options);
  }
}
