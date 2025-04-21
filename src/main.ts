import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import * as cors from 'cors';
import { ExpressAdapter } from '@nestjs/platform-express';

async function bootstrap(): Promise<void> {
  // const app = await NestFactory.create(AppModule, { bodyParser: true });
  const isProd = process.env.NODE_ENV === 'production';
  const httpLogger = new Logger('HTTP');
  const server = express();
  server.use(
    cors({
      origin: isProd
        ? ['https://blinkly.app', 'https://www.blinkly.app']
        : true,
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Csrf-Token',
        'X-Xsrf-Token',
        'X-Requested-With',
        'X-Request-Id',
        'X-Request-Time',
        'DNT',
        'Sec-Ch-Ua',
        'Sec-Ch-Ua-Mobile',
        'Sec-Ch-Ua-Platform',
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
        'X-Forward-Cloudflare-Headers',
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
        'Device-Id',
        'Priority',
        'Cookie',
      ],
      exposedHeaders: [
        'Set-Cookie',
        'X-Csrf-Token',
        'X-Request-Id',
        'X-Request-Time',
        'XSRF-Token',
        'Cookie',
      ],
      optionsSuccessStatus: 204,
      preflightContinue: false,
      maxAge: 86400,
    }),
  );

  server.use(cookieParser());
  server.use(
    helmet({
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'", 'https:'],
              scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://www.googletagmanager.com',
                'https://www.google-analytics.com',
                'https://connect.facebook.net',
                'https://analytics.google.com',
                'https://cdn.gpteng.co',
              ],
              connectSrc: ["'self'", 'https:', 'wss:'],
              imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
              styleSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://fonts.googleapis.com',
              ],
              fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
              frameSrc: ["'self'", 'https:'],
              objectSrc: ["'none'"],
              formAction: ["'self'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
      hsts: isProd
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
      frameguard: { action: 'deny' },
      noSniff: true,
      hidePoweredBy: true,
    }),
  );

  if (isProd) {
    server.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );
  }

  // 4) Mount Nest על גבי Express
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    bodyParser: true,
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
    const config = new DocumentBuilder()
      .setTitle('Blinkly API')
      .setDescription('API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }
  const port = process.env.PORT || 3000;
  // 5) Start listening on Express server
  await server.listen(port, () => {
    console.log(
      `🔥 Server listening on port ${port} (${isProd ? 'PROD' : 'DEV'})`,
    );
  });
  // // 1) Trust proxy (Cloudflare)
  // app.getHttpAdapter().getInstance().set('trust proxy', 1);
  //
  // // 2) Enable CORS
  // app.enableCors({
  //   origin: isProd ? ['https://blinkly.app', 'https://www.blinkly.app'] : true,
  //   methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  //   credentials: true,
  //   allowedHeaders: [
  //     'content-type',
  //     'authorization',
  //     'x-csrf-token',
  //     'x-xsrf-token',
  //     'x-request-id',
  //     'x-request-time',
  //     'dnt',
  //     'sec-ch-ua',
  //     'sec-ch-ua-mobile',
  //     'sec-ch-ua-platform',
  //     'x-requested-with',
  //     'cf-ipcountry',
  //     'cf-ray',
  //     'cf-visitor',
  //     'cf-device-type',
  //     'cf-metro-code',
  //     'cf-region',
  //     'cf-region-code',
  //     'cf-connecting-ip',
  //     'cf-ipcity',
  //     'x-geo-data',
  //     'cf-ipcontinent',
  //     'cf-iplatitude',
  //     'cf-iplongitude',
  //     'cf-iptimezone',
  //     'x-forward-cloudflare-headers',
  //     'x-user-agent',
  //     'x-language',
  //     'x-platform',
  //     'x-screen-width',
  //     'x-screen-height',
  //     'x-time-zone',
  //     'x-color-depth',
  //     'x-hardware-concurrency',
  //     'x-device-memory',
  //     'x-custom-header',
  //     'x-fb-browser-id',
  //     'x-fb-click-id',
  //     'device-id',
  //     'priority',
  //     'cookie',
  //   ],
  //   exposedHeaders: [
  //     'set-cookie',
  //     'x-csrf-token',
  //     'x-request-id',
  //     'x-request-time',
  //     'xsrf-token',
  //     'cookie',
  //   ],
  //   maxAge: 86400,
  // });
  //
  // // 3) Security headers
  // app.use(
  //   helmet({
  //     referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  //     contentSecurityPolicy: isProd
  //       ? {
  //           directives: {
  //             defaultSrc: ["'self'", 'https:'],
  //             scriptSrc: [
  //               "'self'",
  //               "'unsafe-inline'",
  //               "'unsafe-eval'",
  //               'https://www.googletagmanager.com',
  //               'https://www.google-analytics.com',
  //               'https://connect.facebook.net',
  //               'https://analytics.google.com',
  //               'https://cdn.gpteng.co',
  //               'https:',
  //             ],
  //             connectSrc: ["'self'", 'https:', 'wss:'],
  //             imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
  //             styleSrc: [
  //               "'self'",
  //               "'unsafe-inline'",
  //               'https://fonts.googleapis.com',
  //             ],
  //             fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
  //             frameSrc: ["'self'", 'https:'],
  //             objectSrc: ["'none'"],
  //             formAction: ["'self'"],
  //             upgradeInsecureRequests: [],
  //           },
  //         }
  //       : false,
  //     hsts: isProd
  //       ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
  //       : false,
  //     frameguard: { action: 'deny' },
  //     noSniff: true,
  //     hidePoweredBy: true,
  //   }),
  // );
  //
  // // 4) Cookie parser
  // app.use(cookieParser());
  //
  // // 5) Rate limiting (prod only)
  // if (isProd) {
  //   app.use(
  //     rateLimit({
  //       windowMs: 15 * 60 * 1000,
  //       max: 100,
  //       standardHeaders: true,
  //       legacyHeaders: false,
  //     }),
  //   );
  // }
  //
  // // 6) Global validation
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     transform: true,
  //     transformOptions: { enableImplicitConversion: true },
  //   }),
  // );
  //
  // // 7) Swagger (dev only)
  // if (!isProd) {
  //   const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
  //   const config = new DocumentBuilder()
  //     .setTitle('Blinkly API')
  //     .setDescription('API Documentation')
  //     .setVersion('1.0')
  //     .addBearerAuth()
  //     .build();
  //   const doc = SwaggerModule.createDocument(app, config);
  //   SwaggerModule.setup('api', app, doc);
  // }
  //
  // // 8) HTTP logging
  // app.use((req: Request, res: Response, next: NextFunction) => {
  //   httpLogger.log(`${req.method} ${req.url}`);
  //   httpLogger.debug(JSON.stringify(req.headers, null, 2));
  //   next();
  // });
  //
  // // 9) Trust Cloudflare headers
  // app.use((req: Request, res: Response, next: NextFunction) => {
  //   req.headers['cf-connecting-ip'] =
  //     req.headers['cf-connecting-ip'] ||
  //     (req.headers['x-forwarded-for'] as string) ||
  //     req.ip;
  //   next();
  // });
  //
  // // 10) Start server
  // const port = process.env.PORT || 3000;
  // await app.listen(port, () =>
  //   console.log(`Listening on ${port} (${isProd ? 'PROD' : 'DEV'})`),
  // );
}

bootstrap();
