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
      cookieName: 'XSRF-TOKEN',
      cookieOptions: {
        secure: true,
        sameSite: 'none',
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24,
        domain:
          process.env.NODE_ENV === 'production' ? '.blinkly.app' : undefined,
      },
      size: 64,
      ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
      getTokenFromRequest: (req: Request) => {
        return req.cookies['XSRF-TOKEN'];
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
