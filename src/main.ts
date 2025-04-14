import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';

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
        : false, // Disable CSP in development for easier testing
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

  // Enhanced CORS configuration
  const corsOptions = {
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
    exposedHeaders: ['x-csrf-token', 'X-Request-ID', 'X-Request-Time'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400,
  };

  app.enableCors(corsOptions);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger configuration
  if (!isProd) {
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Blinkly API')
      .setDescription('Blinkly API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document);
  }

  const port = process.env.PORT || 5147;
  await app.listen(port);
  console.log(
    `Server running in ${isProd ? 'production' : 'development'} mode on port ${port}`,
  );
}

bootstrap();
