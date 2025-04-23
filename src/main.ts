import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { NextFunction, Request, Response } from 'express';
import { TransformInterceptor } from './interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  const isProd = process.env.NODE_ENV === 'production';
  app.useGlobalInterceptors(new TransformInterceptor());

  app.enableCors({
    origin: isProd ? ['https://blinkly.app', 'https://www.blinkly.app'] : true,
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
      'x-fb-browser-id',
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
    ],
    maxAge: 86400,
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document);
  }

  const httpLogger = new Logger('HTTP');
  app.use((req: Request, res: Response, next: NextFunction) => {
    httpLogger.log(`Incoming: ${req.method} ${req.url}`);
    httpLogger.debug(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
    next();
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, () =>
    console.log(
      `Server listening on port ${port} (${isProd ? 'PROD' : 'DEV'})`,
    ),
  );
}

void bootstrap();
