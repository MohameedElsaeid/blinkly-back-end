import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClickEvent } from '../../entities/click-event.entity';
import { Link } from '../../entities/link.entity';

@Processor('analytics')
export class AnalyticsProcessor {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(
    @InjectRepository(ClickEvent)
    private readonly clickEventRepository: Repository<ClickEvent>,
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
  ) {}

  @Process('process')
  async handleAnalytics(job: Job) {
    try {
      this.logger.debug(`Processing analytics job ${job.id}`);
      const { linkId, clickData } = job.data;

      // Find the link
      const link = await this.linkRepository.findOne({
        where: { id: linkId },
      });

      if (!link) {
        throw new Error(`Link not found: ${linkId}`);
      }

      // Create and save click event
      const clickEvent = this.clickEventRepository.create({
        link,
        ...clickData,
      });

      await this.clickEventRepository.save(clickEvent);

      // Update link click count
      link.clickCount = (link.clickCount || 0) + 1;
      await this.linkRepository.save(link);

      this.logger.debug(`Completed analytics job ${job.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process analytics job ${job.id}: ${error.message}`,
      );
      throw error;
    }
  }
}
