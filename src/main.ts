import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // Create the NestJS application with body parser enabled
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  const isProd = process.env.NODE_ENV === 'production';
  console.log('NODE_ENV is:', process.env.NODE_ENV);

  // Set trust proxy on the underlying Express instance
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Apply Helmet for setting secure HTTP headers
  app.use(
    helmet({
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"], // adjust if you load external scripts
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      hsts: {
        maxAge: 31536000, // one year in seconds
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      hidePoweredBy: true,
    }),
  );

  // Use cookie-parser to handle cookies
  app.use(cookieParser());

  // (Optional) Apply rate limiting in production to mitigate abuse/DDoS attacks
  if (isProd) {
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );
  }

  // Enable CORS: in production, allow only trusted origins; in development, allow all origins
  if (isProd) {
    app.enableCors({
      origin: ['https://blinkly.app', 'https://www.blinkly.app'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    });
  } else {
    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    });
  }

  // Set up a global validation pipe with request transformation and whitelisting
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
    SwaggerModule.setup('api', app, document);
  }

  // Start listening on the designated port
  const port = process.env.PORT || 5147;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
