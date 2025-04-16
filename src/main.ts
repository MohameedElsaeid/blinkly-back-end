import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { doubleCsrf } from 'csrf-csrf';
import { NextFunction, Request, Response } from 'express';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  const isProd = process.env.NODE_ENV === 'production';

  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  const httpLogger = new Logger('HTTP');
  app.use((req: Request, res: Response, next: NextFunction) => {
    httpLogger.log(`Incoming Request: ${req.method} ${req.url}`);
    // Log headers in a pretty format
    httpLogger.debug(`Headers:\n${JSON.stringify(req.headers, null, 2)}`);
    // Log body only if available; can be empty for GET requests
    httpLogger.debug(`Params:\n${JSON.stringify(req.params, null, 2)}`);
    next();
  });

  app.use(
    helmet({
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'", 'https:'],
              scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                'https://www.googletagmanager.com',
                'https://www.google-analytics.com',
                'https://connect.facebook.net',
                'https://analytics.google.com',
                'https://cdn.gpteng.co',
                'https:',
              ],
              connectSrc: ["'self'", 'https:', 'wss:'],
              imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
              styleSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://fonts.googleapis.com',
                'https:',
              ],
              fontSrc: [
                "'self'",
                'https://fonts.gstatic.com',
                'data:',
                'https:',
              ],
              frameSrc: ["'self'", 'https:'],
              objectSrc: ["'none'"],
              formAction: ["'self'"],
              upgradeInsecureRequests: isProd ? [] : null,
            },
          }
        : false,
      hsts: isProd
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
      frameguard: { action: 'deny' },
      noSniff: true,
      hidePoweredBy: true,
    }),
  );

  app.use(cookieParser());

  const { doubleCsrfProtection, generateToken } = doubleCsrf({
    getSecret: () =>
      process.env.CSRF_SECRET || 'pI4JjN2LmnX9b7A3TzcM5qL8C2FdR3Gs',
    cookieName: '__Host-psifi.x-csrf-token',
    cookieOptions: {
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24,
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  });

  // Add this middleware before doubleCsrfProtection
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Generate and set CSRF token for all requests
    const token = generateToken(req, res);
    res.cookie('XSRF-TOKEN', token, {
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      httpOnly: false,
      path: '/',
    });
    res.locals.csrfToken = token;
    next();
  });

  app.use(doubleCsrfProtection);

  if (isProd) {
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );
  }

  app.enableCors({
    origin: isProd ? ['https://blinkly.app', 'https://www.blinkly.app'] : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-csrf-token',
      'X-Request-ID',
      'X-Request-Time',
      'DNT',
      'Sec-Ch-Ua',
      'Sec-Ch-Ua-Mobile',
      'Sec-Ch-Ua-Platform',
      // Cloudflare Headers
      'CF-IPCountry',
      'CF-Ray',
      'CF-Visitor',
      'CF-Device-Type',
      'CF-Metro-Code',
      'CF-Region',
      'CF-Region-Code',
      'CF-Connecting-IP',
      'CF-IPCity',
      'CF-IPContinent',
      'CF-IPLatitude',
      'CF-IPLongitude',
      'CF-IPTimeZone',
      'x-forward-cloudflare-headers',
      // Tracking headers from frontend
      'X-User-Agent',
      'X-Language',
      'X-Platform',
      'X-Screen-Width',
      'X-Screen-Height',
      'X-Time-Zone',
      'X-Color-Depth',
      'X-Hardware-Concurrency',
      'X-Device-Memory',
      'X-Custom-Header',
      'X-FB-Browser-ID',
      'X-FB-Click-ID',
      // Add these to match frontend
      'X-XSRF-TOKEN',
      'Device-ID',
      'Priority',
      'Sec-CH-UA',
      'Sec-Fetch-Site',
      'Sec-Fetch-Mode',
      'Sec-Fetch-Dest',
      'Referer',
      'Origin',
    ],
    exposedHeaders: [
      'x-csrf-token',
      'set-cookie',
      'X-Request-ID',
      'X-Request-Time',
    ],
    credentials: true,
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (!isProd) {
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Blinkly API')
      .setDescription('API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    SwaggerModule.setup(
      'api',
      app,
      SwaggerModule.createDocument(app, swaggerConfig),
    );
  }

  const port = process.env.PORT || 5147;
  await app.listen(port, () => {
    console.log(
      `Server running in ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'} mode`,
    );
    console.log(`Listening on port ${port}`);
    console.log(`CSRF Protection: ${isProd ? 'ENABLED' : 'TEST MODE'}`);
  });
}

bootstrap();
