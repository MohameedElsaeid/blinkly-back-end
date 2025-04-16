//csrf.service.ts
import { Injectable } from '@nestjs/common';
import { doubleCsrf } from 'csrf-csrf';
import { Request, Response } from 'express';

@Injectable()
export class CsrfService {
  private readonly csrfUtilities: ReturnType<typeof doubleCsrf>;

  constructor() {
    this.csrfUtilities = doubleCsrf({
      getSecret: () =>
        process.env.CSRF_SECRET || 'pI4JjN2LmnX9b7A3TzcM5qL8C2FdR3Gh',
      cookieName:
        process.env.NODE_ENV === 'production'
          ? '__Host-psifi.x-csrf-token'
          : 'psifi.x-csrf-token',
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24,
        domain:
          process.env.NODE_ENV === 'production' ? '.blinkly.app' : undefined,
      },
      size: 64,
      ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
      getTokenFromRequest: (req: Request) => {
        console.log('ddd');
        return (
          req.headers['x-csrf-token'] ||
          req.headers['x-xsrf-token'] ||
          req.cookies['XSRF-TOKEN'] ||
          req.body?.csrfToken
        );
      },
    });
  }

  generateToken(req: Request, res: Response): string {
    return this.csrfUtilities.generateToken(req, res);
  }

  doubleCsrfProtection() {
    return this.csrfUtilities.doubleCsrfProtection;
  }
}
