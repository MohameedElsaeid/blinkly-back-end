# Blinkly Platform

Blinkly Platform is a comprehensive URL shortening and analytics service built using NestJS. It includes modules for user authentication, link management, analytics, QR code generation, payments with Stripe integration, and dynamic pricing packages with seeded subscription tiers.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running in Development](#running-in-development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Additional Information](#additional-information)

## Features

- **User Registration & Authentication:** Secure sign-up/login using JWT
- **Link Management:** Create and manage standard and dynamic short links
- **Analytics:** Track clicks, device/browser analytics, and more
- **QR Code Generation:** Generate customizable QR codes for links
- **Payments & Subscriptions:** Integrate with Stripe to manage subscriptions and payments
- **Packages Module:** Seed pricing packages (monthly and yearly) and expose an API for dynamic pricing tiers

## Project Structure

```
blinkly-platform/
├── src/
│   ├── analytics/                 # Analytics module
│   │   ├── analytics.controller.ts
│   │   ├── analytics.module.ts
│   │   └── analytics.service.ts
│   ├── auth/                     # Authentication module
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── auth.controller.ts
│   │   └── auth.service.ts
│   ├── config/                   # Configuration
│   │   ├── configuration.ts
│   │   └── env.validation.ts
│   ├── entities/                 # Database entities
│   │   ├── user.entity.ts
│   │   ├── link.entity.ts
│   │   └── ...
│   ├── links/                    # Links module
│   │   ├── dto/
│   │   ├── links.controller.ts
│   │   └── links.service.ts
│   ├── payments/                 # Payments module
│   │   ├── dto/
│   │   ├── payments.controller.ts
│   │   └── stripe.service.ts
│   ├── qr/                       # QR code module
│   │   ├── dto/
│   │   ├── qr.controller.ts
│   │   └── qr.service.ts
│   ├── queue/                    # Queue processing
│   │   ├── processors/
│   │   └── queue.service.ts
│   ├── webhooks/                 # Webhooks module
│   │   ├── dto/
│   │   └── webhooks.service.ts
│   ├── app.module.ts
│   ├── lambda.ts                 # AWS Lambda handler
│   └── main.ts                   # Application entry point
├── test/                         # Test files
├── Dockerfile                    # Docker configuration
├── docker-compose.yml            # Docker Compose configuration
├── nest-cli.json                # NestJS CLI configuration
├── package.json                 # Project dependencies
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Project documentation
```

## API Documentation

### Authentication APIs

#### Sign Up
```http
POST /auth/signup
Content-Type: application/json
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "passwordConfirmation": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "countryCode": "+1",
  "phoneNumber": "1234567890",
  "country": "US"
}
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "token": "jwt_token"
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token",
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
}
```

### Links APIs

#### Create Short Link
```http
POST /api/links
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:
```json
{
  "originalUrl": "https://example.com/long-url",
  "alias": "custom-alias",
  "tags": ["marketing", "social"],
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

Response:
```json
{
  "id": "uuid",
  "originalUrl": "https://example.com/long-url",
  "alias": "custom-alias",
  "shortUrl": "https://blink.ly/custom-alias",
  "clickCount": 0,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### Create Dynamic Link
```http
POST /api/dynamic-links
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:
```json
{
  "name": "App Download Link",
  "alias": "get-app",
  "defaultUrl": "https://example.com/download",
  "rules": [
    {
      "platform": "ios",
      "url": "https://apps.apple.com/app/id123"
    },
    {
      "platform": "android",
      "url": "https://play.google.com/store/apps/details?id=com.example"
    }
  ]
}
```

### Analytics APIs

#### Get Link Analytics
```http
GET /analytics/link/:id
Authorization: Bearer <token>
```

Response:
```json
{
  "totalClicks": 1000,
  "clicksByCountry": {
    "US": 500,
    "UK": 300,
    "Other": 200
  },
  "clicksByDevice": {
    "Mobile": 600,
    "Desktop": 400
  },
  "clicksByBrowser": {
    "Chrome": 450,
    "Safari": 350,
    "Firefox": 200
  }
}
```

### QR Code APIs

#### Generate QR Code
```http
POST /qr
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:
```json
{
  "linkId": "uuid",
  "size": 300,
  "color": "#000000",
  "backgroundColor": "#FFFFFF",
  "logoUrl": "https://example.com/logo.png"
}
```

### Payments APIs

#### Create Subscription
```http
POST /payments/subscriptions
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:
```json
{
  "planId": "plan_uuid",
  "paymentMethodId": "pm_..."
}
```

## Requirements

- Node.js (v16+ recommended)
- npm (v7+ recommended) or Yarn
- PostgreSQL Database
- Redis for caching and queues
- AWS Account (for deployment)
- Stripe account for payment processing

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/blinkly-platform.git
cd blinkly-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

## Environment Setup

Configure your `.env` file with the necessary environment variables:

```dotenv
# Node Environment
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_db_username
DATABASE_PASSWORD=your_db_password
DATABASE_NAME=blinkly_db

# JWT Configuration
JWT_SECRET=your_jwt_secret

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## Running in Development

1. Start the development server:
```bash
npm run start:dev
```

2. The API will be available at `http://localhost:3000`

## Testing

Run the test suite:

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

### Using Docker

1. Build the Docker image:
```bash
docker build -t blinkly-api .
```

2. Run with Docker Compose:
```bash
docker-compose up -d
```

### Using AWS Lambda

1. Configure AWS credentials
2. Deploy using Serverless Framework:
```bash
npm run deploy
```

## Additional Information

### Security Features

- JWT-based authentication
- Rate limiting
- CORS protection
- XSS prevention
- CSRF protection
- Input validation
- Request sanitization
- Helmet security headers

### Monitoring and Logging

- Winston logger integration
- Health checks
- Error tracking
- Performance monitoring

### Database Migrations

- TypeORM migrations
- Automatic schema updates
- Data seeding for packages

## License

This project is licensed under the MIT License.