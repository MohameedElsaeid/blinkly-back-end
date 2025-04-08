# Blinkly Platform

Blinkly Platform is a comprehensive URL shortening and analytics service built using NestJS. It includes modules for user authentication, link management, analytics, QR code generation, payments with Stripe integration, and dynamic pricing packages with seeded subscription tiers.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running in Development](#running-in-development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Additional Information](#additional-information)

## Features

- **User Registration & Authentication:** Secure sign-up/login using JWT.
- **Link Management:** Create and manage standard and dynamic short links.
- **Analytics:** Track clicks, device/browser analytics, and more.
- **QR Code Generation:** Generate customizable QR codes for links.
- **Payments & Subscriptions:** Integrate with Stripe to manage subscriptions and payments.
- **Packages Module:** Seed pricing packages (monthly and yearly) and expose an API for dynamic pricing tiers.

## Project Structure

```up
blinkly-platform/
├── package.json
├── tsconfig.json
├── ormconfig.json
├── serverless.yml
├── webpack.config.js
└── src
    ├── main.ts
    ├── lambda.ts
    ├── app.module.ts
    ├── entities
    │   ├── user.entity.ts
    │   ├── link.entity.ts
    │   ├── dynamic-link.entity.ts
    │   ├── click-event.entity.ts
    │   ├── subscription.entity.ts
    │   ├── payment.entity.ts
    │   └── package.entity.ts
    ├── auth
    │   ├── auth.module.ts
    │   ├── auth.service.ts
    │   ├── auth.controller.ts
    │   ├── jwt.strategy.ts
    │   └── dto
    │       ├── create-user.dto.ts
    │       └── login.dto.ts
    ├── users
    │   ├── users.module.ts
    │   ├── users.service.ts
    │   ├── users.controller.ts
    │   └── dto
    │       └── update-user.dto.ts
    ├── links
    │   ├── links.module.ts
    │   ├── links.service.ts
    │   ├── links.controller.ts
    │   └── dto
    │       ├── create-link.dto.ts
    │       ├── update-link.dto.ts
    │       ├── create-dynamic-link.dto.ts
    │       └── update-social-meta.dto.ts
    ├── analytics
    │   ├── analytics.module.ts
    │   ├── analytics.service.ts
    │   └── analytics.controller.ts
    ├── qr
    │   ├── qr.module.ts
    │   ├── qr.service.ts
    │   └── qr.controller.ts
    ├── payments
    │   ├── payments.module.ts
    │   ├── payments.service.ts
    │   ├── payments.controller.ts
    │   └── dto
    │       ├── create-subscription.dto.ts
    │       └── update-subscription.dto.ts
    └── packages
        ├── packages.module.ts
        ├── packages.service.ts
        └── packages.controller.ts
```

## Requirements

- Node.js (v16+ recommended)
- npm (v7+ recommended) or Yarn
- PostgreSQL Database
- AWS Account (for deployment with Serverless Framework)
- Stripe account for payment processing

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/blinkly-platform.git
   cd blinkly-platform

2. **Install dependencies:**

   ```bash
   git clone https://github.com/yourusername/blinkly-platform.git
   cd blinkly-platform
 
3. **Set up environment variables:**

   ```bash
   git clone https://github.com/yourusername/blinkly-platform.git
   cd blinkly-platform

## Environment Setup
Create a .env file in the root directory with the following content:

```.dotenv
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

# Stripe Price IDs for Monthly Plans
STRIPE_PRICE_BASIC_MONTHLY=price_basic_monthly_id
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_professional_monthly_id
STRIPE_PRICE_BUSINESS_MONTHLY=price_business_monthly_id
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_enterprise_monthly_id

# Stripe Price IDs for Yearly Plans
STRIPE_PRICE_BASIC_YEARLY=price_basic_yearly_id
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_professional_yearly_id
STRIPE_PRICE_BUSINESS_YEARLY=price_business_yearly_id
STRIPE_PRICE_ENTERPRISE_YEARLY=price_enterprise_yearly_id
```
Update each placeholder with your actual configuration values.


### Running in Development

1. **Start the NestJS application:**

   ```bash
   npm run start:dev
   ```
2. The application will run on the port specified in your .env (default: http://localhost:port).

### Testing

Run tests using Jest:

   ```bash
   npm run test
   ```


### Deployment

This project uses the Serverless Framework to deploy to AWS Lambda.

1. Ensure your AWS credentials are configured (e.g., via the AWS CLI or environment variables).
2. Configure serverless.yml: 
   - Update serverless.yml with your AWS region, stage, and environment variables as needed.
3. Build the project:

   ```bash
   npm run build
   ```
4. Deploy the application:

   ```bash
   npm run deploy
   ```

Deployment will package your application using Webpack and deploy it as a Lambda function.



### Additional Information
* Stripe Webhook:

  The /payments/webhook endpoint is set up to receive webhook events from Stripe. Ensure that your Stripe webhook endpoint is configured correctly in your Stripe Dashboard.

* Seeding Packages:

  The Packages module automatically seeds the database with subscription packages if none exist. You can retrieve these packages via the GET /packages endpoint.


* Further Customization:

  This project is modular and scalable. Feel free to extend each module as needed (e.g., adding more endpoints, refining business logic, or improving error handling).

#### License
This project is licensed under the MIT License.



---