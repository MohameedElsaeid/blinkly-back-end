import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { VisitorService } from '../visitor/visitor.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class VisitorMiddleware implements NestMiddleware {
  constructor(
    private readonly visitorService: VisitorService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        const payload = this.jwtService.verify(token);
        const userId = payload.sub;

        // if (userId) {
        //   await this.visitorService.trackVisitor(userId, {
        //     ipAddress: req.ip as string,
        //     userAgent: req.headers['user-agent'] || '',
        //     deviceId: req.headers['device-id'] as string,
        //     headers: req.headers as Record<string, string>,
        //   });
        // }
      }
    } catch (error) {
      // Log error but don't block the request
      console.error('Error tracking visitor:', error);
    }
    next();
  }
}
