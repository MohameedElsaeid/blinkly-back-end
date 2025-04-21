//main.ts
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

  app.enableCors({
    origin: isProd
      ? [
          'https://blinkly.app',
          'https://www.blinkly.app',
          'https://api.blinkly.app',
        ]
      : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*',
    exposedHeaders: [
      'set-cookie',
      'x-csrf-token',
      'set-cookie',
      'X-Request-ID',
      'X-Request-Time',
      'XSRF-TOKEN',
      'set-cookie',
      'x-csrf-token',
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

  const port = process.env.PORT || 5147;
  await app.listen(port, () => {
    console.log(
      `Server running in ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'} mode`,
    );
    console.log(`Listening on port ${port}`);
    console.log(`CSRF Protection: ${isProd ? 'ENABLED' : 'TEST MODE'}`);
  });
}

void bootstrap();
