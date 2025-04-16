// src/csrf/csrf.module.ts
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { doubleCsrf } from 'csrf-csrf';

@Module({})
export class CsrfModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 1) Re-create your CSRF factory here (or import your config constants)
    const { doubleCsrfProtection } = doubleCsrf({
      getSecret: () => process.env.CSRF_SECRET!,
      cookieName: '__Host-psifi.x-csrf-token',
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
      getTokenFromRequest: (req) =>
        req.headers['x-csrf-token'] ||
        req.headers['x-xsrf-token'] ||
        req.cookies['XSRF-TOKEN'] ||
        req.body?.csrfToken,
    });

    // 2) Apply it everywhere **except** GET /auth/csrf-token
    consumer
      .apply(doubleCsrfProtection)
      .exclude({ path: 'auth/csrf-token', method: RequestMethod.GET })
      .forRoutes('*');
  }
}
