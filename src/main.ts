import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // Create the NestJS application with body parser enabled
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  const isProd = process.env.NODE_ENV === 'production';

  // Apply Helmet for setting secure HTTP headers, including a strict referrer policy
  app.use(
    helmet({
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // Use cookie-parser if your app uses cookies
  app.use(cookieParser());

  // Enable CORS: in production, only allow your trusted front-end domains;
  // in development, allow all origins for ease of testing.
  if (isProd) {
    // Replace these with your actual front-end URLs if they differ
    app.enableCors({
      origin: [
        'https://blinkly.app',
        'https://www.blinkly.app',
        'https://api.blinkly.app',
      ],
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

  // Set up a global validation pipe with built-in transformation and whitelist enabled
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Conditionally enable Swagger documentation in non-production environments
  if (!isProd) {
    // Only load Swagger in development; this protects your API docs in production.
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

  const port = process.env.PORT || 5147;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
