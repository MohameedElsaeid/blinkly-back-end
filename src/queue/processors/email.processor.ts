import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

interface IEmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

@Processor('emails')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  @Process('send')
  async handleEmail(job: Job<IEmailJobData>): Promise<void> {
    try {
      this.logger.debug(`Processing email job ${job.id}`);
      const { to, subject, template, data } = job.data;

      await this.sendEmail(to, subject, template, data);
      this.logger.debug(`Completed email job ${job.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process email job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  private async sendEmail(
    to: string,
    subject: string,
    template: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    // Implement email sending logic
    this.logger.debug(`Sending email to ${to} with subject: ${subject}`);
    await Promise.resolve(); // Placeholder for actual email service integration
  }
}