import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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

  // Helmet configuration
  app.use(
    helmet({
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: [],
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

  // Cookie parser must come before CSRF middleware
  app.use(cookieParser());

  // CSRF Configuration
  const { doubleCsrfProtection, generateToken } = doubleCsrf({
    getSecret: () =>
      process.env.CSRF_SECRET || 'pI4JjN2LmnX9b7A3TzcM5qL8C2FdR3Gs',
    cookieName: '__Host-psifi.x-csrf-token',
    cookieOptions: {
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  });

  // CSRF Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Generate token with both req and res
    res.locals.csrfToken = generateToken(req, res);
    next();
  });

  // Apply CSRF protection
  app.use(doubleCsrfProtection);

  // Rate limiting
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

  // CORS Configuration
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
    ],
    exposedHeaders: ['x-csrf-token'],
    credentials: true,
    maxAge: 86400,
  });

  // Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger (Dev only)
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

  // Start server
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
