import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { NextFunction, Request, Response } from 'express';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  const isProd = process.env.NODE_ENV === 'production';

  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.use(cookieParser());
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.header(
        'Access-Control-Allow-Origin',
        isProd ? 'https://blinkly.app' : '*',
      );
      res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS, PUT, DELETE',
      );
      res.header(
        'Access-Control-Allow-Headers',
        req.header('Access-Control-Request-Headers'),
      );
      res.header('Access-Control-Max-Age', '86400');
      return res.sendStatus(204);
    }
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
              connectSrc: [
                "'self'",
                'https:',
                'wss:',
                'https://api.blinkly.app',
                'https://blinkly.app',
              ],
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

  app.enableCors({
    origin: isProd
      ? [
          'https://blinkly.app',
          'https://www.blinkly.app',
          'https://api.blinkly.app',
        ]
      : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'content-type',

      'Authorization',
      'authorization',

      'X-csrf-token',
      'x-csrf-token',

      'X-Request-ID',
      'x-request-id',

      'X-Request-Time',
      'x-request-time',

      'DNT',
      'dnt',

      'Sec-Ch-Ua',
      'sec-ch-ua',

      'Sec-Ch-Ua-Mobile',
      'sec-ch-ua-mobile',

      'Sec-Ch-Ua-Platform',
      'sec-ch-ua-platform',

      'X-requested-with',
      'x-requested-with',

      'CF-IPCountry',
      'cf-ipcountry',

      'CF-Ray',
      'cf-ray',

      'CF-Visitor',
      'cf-visitor',

      'CF-Device-Type',
      'cf-device-type',

      'CF-Metro-Code',
      'cf-metro-code',

      'CF-Region',
      'cf-region',

      'CF-Region-Code',
      'cf-region-code',

      'CF-Connecting-IP',
      'cf-connecting-ip',

      'CF-IPCity',
      'cf-ipcity',

      'xGeoData',
      'xgeodata',
      'x-geo-data',

      'CF-IPContinent',
      'cf-ipcontinent',

      'CF-IPLatitude',
      'cf-iplatitude',

      'CF-IPLongitude',
      'cf-iplongitude',

      'CF-IPTimeZone',
      'cf-iptimezone',

      'X-forward-cloudflare-headers',
      'x-forward-cloudflare-headers',

      'X-User-Agent',
      'x-user-agent',

      'X-Language',
      'x-language',

      'X-Platform',
      'x-platform',

      'X-Screen-Width',
      'x-screen-width',

      'X-Screen-Height',
      'x-screen-height',

      'X-Time-Zone',
      'x-time-zone',

      'X-Color-Depth',
      'x-color-depth',

      'X-Hardware-Concurrency',
      'x-hardware-concurrency',

      'X-Device-Memory',
      'x-device-memory',

      'X-Custom-Header',
      'x-custom-header',

      'X-FB-Browser-ID',
      'x-fb-browser-id',

      'X-FB-Click-ID',
      'x-fb-click-id',

      'X-XSRF-TOKEN',
      'x-xsrf-token',

      'Device-ID',
      'device-id',

      'Priority',
      'priority',

      'X-xsrf-token',
      'x-xsrf-token',

      'Cookie',
      'cookie',
    ],
    exposedHeaders: [
      'Set-cookie',
      'set-cookie',

      'X-csrf-token',
      'x-csrf-token',

      'X-Request-ID',
      'x-request-id',

      'X-Request-Time',
      'x-request-time',

      'XSRF-TOKEN',
      'xsrf-token',

      'Cookie',
      'cookie',
    ],
    credentials: true,
    maxAge: 86400,
  });

  const httpLogger = new Logger('HTTP');

  app.use((req: Request, res: Response, next: NextFunction) => {
    httpLogger.log(`Incoming Request User: ${req.user}`);

    httpLogger.log(`Incoming Request: ${req.method} ${req.url}`);
    // Log headers in a pretty format
    httpLogger.debug(`Headers:\n${JSON.stringify(req.headers, null, 2)}`);
    // Log params only if available
    httpLogger.debug(`Params:\n${JSON.stringify(req.params, null, 2)}`);
    next();
  });

  // Middleware to trust Cloudflare headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.headers['cf-connecting-ip'] =
      req.headers['cf-connecting-ip'] ||
      req.headers['x-forwarded-for'] ||
      req.ip;

    // Log all incoming Cloudflare headers for debugging
    const cfHeaders = Object.entries(req.headers).filter(([key]) =>
      key.toLowerCase().startsWith('cf-'),
    );
    httpLogger.debug(`Cloudflare Headers: ${JSON.stringify(cfHeaders)}`);

    next();
  });

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

  const port = process.env.PORT || 3000;
  await app.listen(port, () => {
    console.log(
      `Server running in ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'} mode`,
    );
    console.log(`Listening on port ${port}`);
    console.log(`CSRF Protection: ${isProd ? 'ENABLED' : 'TEST MODE'}`);
  });
}

void bootstrap();
