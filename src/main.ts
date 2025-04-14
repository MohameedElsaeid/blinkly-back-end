import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit'; // optional for rate limiting
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // Create the NestJS application with body parser enabled.
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  const isProd = process.env.NODE_ENV === 'production';

  // Apply Helmet to help secure your app by setting various HTTP headers.
  // You can customize the options further if needed.
  app.use(
    helmet({
      // Enforce a strict referrer policy
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      // Set a Content Security Policy (CSP) to limit what resources can be loaded
      contentSecurityPolicy: {
        directives: {
          // Allow resources only from your own origin
          defaultSrc: ["'self'"],
          // Allow scripts from your domain (adjust if you use external scripts)
          scriptSrc: ["'self'"],
          // Optionally, allow inline scripts if absolutely necessary (try to avoid unsafe-inline)
          // scriptSrc: ["'self'", "'unsafe-inline'"],
          // Disable or restrict object, media, and frame sources as needed
          objectSrc: ["'none'"],
          // Automatically upgrade any HTTP requests to HTTPS
          upgradeInsecureRequests: [],
        },
      },
      // Enable HTTP Strict Transport Security (HSTS)
      hsts: {
        maxAge: 31536000, // One year (in seconds)
        includeSubDomains: true,
        preload: true,
      },
      // Prevent your site from being framed, which can protect against clickjacking
      frameguard: { action: 'deny' },
      // Set X-Content-Type-Options header to prevent MIME-sniffing
      noSniff: true,
      // Optionally, add Permissions Policy (recently renamed from Feature Policy)
      // permissionsPolicy: {
      //   features: {
      //     fullscreen: ["'self'"],
      //     // You can configure other features as needed
      //   },
      // },
      // You can also disable the X-Powered-By header by default via Helmet
      hidePoweredBy: true,
    }),
  );

  // Use cookie-parser for cookie support.
  app.use(cookieParser());

  // (Optional) Apply rate limiting to reduce brute-force and DDoS attacks.
  if (isProd) {
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );
  }

  // Enable CORS.
  // In production, only allow your trusted front-end origins.
  if (isProd) {
    app.enableCors({
      origin: ['https://blinkly.app', 'https://www.blinkly.app'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    });
  } else {
    // In development, allow all origins.
    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    });
  }

  // Set up a global validation pipe.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Conditional Swagger documentation: only enable in non-production environments.
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

  // Start the application.
  const port = process.env.PORT || 5147;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
