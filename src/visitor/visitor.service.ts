import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visitor } from '../entities/visitor.entity';
import * as geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import { createHash } from 'crypto';

interface IVisitorData {
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  headers: Record<string, string>;
}

@Injectable()
export class VisitorService {
  private readonly logger = new Logger(VisitorService.name);

  constructor(
    @InjectRepository(Visitor)
    private readonly visitorRepository: Repository<Visitor>,
  ) {}

  async trackVisitor(userId: string, data: IVisitorData): Promise<Visitor> {
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

      const visitorData = {
        deviceId: data.deviceId,
        fingerprint,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        acceptEncoding: data.headers['accept-encoding'],
        acceptLanguage: data.headers['accept-language'],
        cdLoop: data.headers['cd-loop'],
        cfConnectingIp: data.headers['cf-connecting-ip'],
        cfCountry: data.headers['cf-country'],
        cfRay: data.headers['cf-ray'],
        cfVisitor: data.headers['cf-visitor'],
        contentType: data.headers['content-type'],
        dnt: data.headers['dnt'],
        host: data.headers['host'],
        language: data.headers['language'],
        origin: data.headers['origin'],
        priority: data.headers['priority'],
        referer: data.headers['referer'],
        requestId: data.headers['request-id'],
        secChUa: data.headers['sec-ch-ua'],
        secChUaMobile: data.headers['sec-ch-ua-mobile'],
        secChUaPlatform: data.headers['sec-ch-ua-platform'],
        secFetchDest: data.headers['sec-fetch-dest'],
        secFetchMode: data.headers['sec-fetch-mode'],
        secFetchSite: data.headers['sec-fetch-site'],
        colorDepth: data.headers['x-color-depth'],
        deviceMemory: data.headers['x-device-memory'],
        hardwareConcurrency: data.headers['x-hardware-concurrency'],
        platform: data.headers['x-platform'],
        screenHeight: data.headers['x-screen-height'],
        screenWidth: data.headers['x-screen-width'],
        timeZone: data.headers['x-time-zone'],
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
        lastVisit: new Date(),
      };

      if (visitor) {
        // Update existing visitor
        visitor.visitCount += 1;
        Object.assign(visitor, visitorData);
      } else {
        // Create new visitor
        visitor = this.visitorRepository.create({
          user: { id: userId },
          visitCount: 1,
          ...visitorData,
        });
      }

      return await this.visitorRepository.save(visitor);
    } catch (error) {
      this.logger.error(`Failed to track visitor: ${error.message}`);
      throw error;
    }
  }

  private generateFingerprint(data: IVisitorData): string {
    const input = `${data.ipAddress}-${data.userAgent}-${data.headers['sec-ch-ua']}-${data.headers['sec-ch-ua-platform']}`;
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
      platforms: this.countByProperty(visitors, 'platform'),
      operatingSystems: this.countByProperty(visitors, 'os'),
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
