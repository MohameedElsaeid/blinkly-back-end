import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // Create the NestJS application with body parser enabled.
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  const isProd = process.env.NODE_ENV === 'production';

  // Set trust proxy on the underlying Express instance (if behind a proxy)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Apply Helmet to set various HTTP security headers.
  app.use(
    helmet({
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      hidePoweredBy: true,
    }),
  );

  // Use cookie-parser to support cookie handling
  app.use(cookieParser());

  // (Optional) Apply rate limiting in production to mitigate abuse/DDoS attacks.
  if (isProd) {
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per window
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );
  }

  // CORS configuration:
  // In production, use a dynamic origin callback to allow only our trusted front-end domains.
  if (isProd) {
    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin) {
          return callback(null, true);
        }
        const allowedOrigins = [
          'https://blinkly.app',
          'https://www.blinkly.app',
        ];
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    });
  } else {
    // Development: Allow all origins.
    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    });
  }

  // Set up a global validation pipe for sanitizing and transforming incoming requests
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Conditionally enable Swagger documentation in non-production environments
  if (!isProd) {
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Blinkly API')
      .setDescription('The Blinkly API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    // The Swagger docs will be available at /api
    SwaggerModule.setup('api', app, document);
  }

  const port = process.env.PORT || 5147;
  await app.listen(port);
  console.log('NODE_ENV is:', process.env.NODE_ENV);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
