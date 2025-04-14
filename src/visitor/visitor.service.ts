import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visitor } from '../entities/visitor.entity';
import * as geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import { createHash } from 'crypto';

@Injectable()
export class VisitorService {
  private readonly logger = new Logger(VisitorService.name);

  constructor(
    @InjectRepository(Visitor)
    private readonly visitorRepository: Repository<Visitor>,
  ) {}

  async trackVisitor(
    userId: string,
    data: {
      ipAddress: string;
      userAgent: string;
      deviceId?: string;
    },
  ): Promise<Visitor> {
    try {
      const fingerprint = this.generateFingerprint(data);
      const geo = geoip.lookup(data.ipAddress);
      const ua = new UAParser(data.userAgent);

      // Try to find existing visitor
      let visitor = await this.visitorRepository.findOne({
        where: [
          { fingerprint, user: { id: userId } },
          { deviceId: data.deviceId, user: { id: userId } },
        ],
      });

      if (visitor) {
        // Update existing visitor
        visitor.visitCount += 1;
        visitor.lastVisit = new Date();
        visitor.ipAddress = data.ipAddress;
        visitor.userAgent = data.userAgent;
      } else {
        // Create new visitor
        visitor = this.visitorRepository.create({
          user: { id: userId },
          deviceId: data.deviceId,
          fingerprint,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          browser: ua.getBrowser().name,
          browserVersion: ua.getBrowser().version,
          os: ua.getOS().name,
          osVersion: ua.getOS().version,
          device: ua.getDevice().model,
          deviceType: ua.getDevice().type,
          country: geo?.country,
          region: geo?.region,
          city: geo?.city,
          latitude: geo?.ll?.[0],
          longitude: geo?.ll?.[1],
          visitCount: 1,
          lastVisit: new Date(),
        });
      }

      return await this.visitorRepository.save(visitor);
    } catch (error) {
      this.logger.error(`Failed to track visitor: ${error.message}`);
      throw error;
    }
  }

  private generateFingerprint(data: {
    ipAddress: string;
    userAgent: string;
  }): string {
    const input = `${data.ipAddress}-${data.userAgent}`;
    return createHash('sha256').update(input).digest('hex');
  }

  async getVisitorStats(userId: string) {
    const visitors = await this.visitorRepository.find({
      where: { user: { id: userId } },
    });

    return {
      totalVisitors: visitors.length,
      totalVisits: visitors.reduce(
        (sum, visitor) => sum + visitor.visitCount,
        0,
      ),
      uniqueCountries: new Set(visitors.map((v) => v.country)).size,
      deviceTypes: this.countByProperty(visitors, 'deviceType'),
      browsers: this.countByProperty(visitors, 'browser'),
      countries: this.countByProperty(visitors, 'country'),
    };
  }

  private countByProperty(visitors: Visitor[], property: keyof Visitor) {
    return visitors.reduce(
      (acc, visitor) => {
        const value = (visitor[property] as string) || 'Unknown';
        acc[value] = (acc[value] || 0) + visitor.visitCount;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
