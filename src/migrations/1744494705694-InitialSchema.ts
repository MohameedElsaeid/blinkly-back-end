import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1744494705694 implements MigrationInterface {
  name = 'InitialSchema1744494705694';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure the schema exists
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "blinkly_db_schema";`);

    // Enable uuid-ossp extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Create enum types in the specific schema
    await queryRunner.query(
      `CREATE TYPE "blinkly_db_schema"."user_role_enum" AS ENUM('USER', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "blinkly_db_schema"."subscription_status_enum" AS ENUM('active', 'trial', 'cancelled', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TYPE "blinkly_db_schema"."billing_frequency_enum" AS ENUM('monthly', 'yearly')`,
    );
    await queryRunner.query(
      `CREATE TYPE "blinkly_db_schema"."plan_name_enum" AS ENUM('FREE', 'BASIC', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "blinkly_db_schema"."redirect_type_enum" AS ENUM('301', '302')`,
    );

    // Create users table in the schema
    await queryRunner.query(`
      CREATE TABLE "blinkly_db_schema"."users" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "firstName" varchar(50) NOT NULL,
          "lastName" varchar(50) NOT NULL,
          "email" varchar(255) UNIQUE NOT NULL,
          "countryCode" varchar(10) NOT NULL,
          "phoneNumber" varchar(20) NOT NULL,
          "password" varchar(255) NOT NULL,
          "role" "blinkly_db_schema"."user_role_enum" NOT NULL DEFAULT 'USER',
          "isActive" boolean NOT NULL DEFAULT true,
          "isEmailVerified" boolean NOT NULL DEFAULT false,
          "isPhoneVerified" boolean NOT NULL DEFAULT false,
          "dateOfBirth" date,
          "address" varchar(255),
          "city" varchar(100),
          "postalCode" varchar(20),
          "profilePicture" varchar(255),
          "bio" text,
          "preferredLanguage" varchar(10) NOT NULL DEFAULT 'en',
          "timezone" varchar(50) NOT NULL DEFAULT 'UTC',
          "activeSubscriptionId" uuid,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Create plans table in the schema
    await queryRunner.query(`
      CREATE TABLE "blinkly_db_schema"."plans" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "name" "blinkly_db_schema"."plan_name_enum" NOT NULL,
          "billingFrequency" "blinkly_db_schema"."billing_frequency_enum" NOT NULL,
          "price" integer,
          "description" varchar(255),
          "features" text,
          "shortenedLinksLimit" integer,
          "qrCodesLimit" integer,
          "freeTrialAvailable" boolean NOT NULL DEFAULT false,
          "freeTrialDays" integer,
          "isMostPopular" boolean NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create user_subscriptions table
    await queryRunner.query(`
      CREATE TABLE "blinkly_db_schema"."user_subscriptions" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "userId" uuid NOT NULL,
          "planId" uuid NOT NULL,
          "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
          "endDate" TIMESTAMP WITH TIME ZONE,
          "status" "blinkly_db_schema"."subscription_status_enum" NOT NULL DEFAULT 'trial',
          "stripeSubscriptionId" varchar(255),
          "stripeCustomerId" varchar(255),
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "fk_user_subscriptions_user" FOREIGN KEY ("userId")
            REFERENCES "blinkly_db_schema"."users"("id") ON DELETE CASCADE,
          CONSTRAINT "fk_user_subscriptions_plan" FOREIGN KEY ("planId")
            REFERENCES "blinkly_db_schema"."plans"("id")
      )
    `);

    // Create links table
    await queryRunner.query(`
      CREATE TABLE "blinkly_db_schema"."links" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "originalUrl" varchar NOT NULL,
          "alias" varchar UNIQUE NOT NULL,
          "isActive" boolean NOT NULL DEFAULT true,
          "tags" text,
          "clickCount" integer NOT NULL DEFAULT 0,
          "redirectType" "blinkly_db_schema"."redirect_type_enum" NOT NULL DEFAULT '302',
          "expiresAt" TIMESTAMP,
          "metaTitle" varchar(255),
          "metaDescription" text,
          "metaImage" varchar(255),
          "description" text,
          "userId" uuid,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "fk_links_user" FOREIGN KEY ("userId")
            REFERENCES "blinkly_db_schema"."users"("id")
      )
    `);

    // Create click_events table
    await queryRunner.query(`
      CREATE TABLE "blinkly_db_schema"."click_events" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "linkId" uuid NOT NULL,
          "ipAddress" varchar,
          "userAgent" varchar,
          "referrer" varchar,
          "country" varchar,
          "state" varchar,
          "city" varchar,
          "latitude" decimal(9,6),
          "longitude" decimal(9,6),
          "operatingSystem" varchar,
          "osVersion" varchar,
          "browserName" varchar,
          "browserVersion" varchar,
          "deviceModel" varchar,
          "sessionId" varchar,
          "utmSource" varchar,
          "utmMedium" varchar,
          "utmCampaign" varchar,
          "utmTerm" varchar,
          "utmContent" varchar,
          "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "fk_click_events_link" FOREIGN KEY ("linkId")
            REFERENCES "blinkly_db_schema"."links"("id")
      )
    `);

    // Create qr_codes table
    await queryRunner.query(`
      CREATE TABLE "blinkly_db_schema"."qr_codes" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "targetUrl" varchar NOT NULL,
          "linkId" uuid,
          "userId" uuid NOT NULL,
          "size" integer NOT NULL DEFAULT 300,
          "color" varchar(7) NOT NULL DEFAULT '#000000',
          "backgroundColor" varchar(7) NOT NULL DEFAULT '#FFFFFF',
          "logoUrl" varchar(255),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "fk_qr_codes_link" FOREIGN KEY ("linkId")
            REFERENCES "blinkly_db_schema"."links"("id"),
          CONSTRAINT "fk_qr_codes_user" FOREIGN KEY ("userId")
            REFERENCES "blinkly_db_schema"."users"("id")
      )
    `);

    // Create dynamic_links table
    await queryRunner.query(`
      CREATE TABLE "blinkly_db_schema"."dynamic_links" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "name" varchar NOT NULL,
          "alias" varchar UNIQUE NOT NULL,
          "defaultUrl" varchar NOT NULL,
          "rules" jsonb NOT NULL,
          "utmParameters" jsonb,
          "metaTitle" varchar,
          "metaDescription" varchar,
          "metaImage" varchar,
          "isActive" boolean NOT NULL DEFAULT true,
          "tags" text,
          "userId" uuid NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "fk_dynamic_links_user" FOREIGN KEY ("userId")
            REFERENCES "blinkly_db_schema"."users"("id")
      )
    `);

    // Create dynamic_link_click_events table
    await queryRunner.query(`
      CREATE TABLE "blinkly_db_schema"."dynamic_link_click_events" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "dynamicLinkId" uuid NOT NULL,
          "ipAddress" varchar,
          "userAgent" varchar,
          "referrer" varchar,
          "country" varchar,
          "state" varchar,
          "city" varchar,
          "latitude" decimal(9,6),
          "longitude" decimal(9,6),
          "operatingSystem" varchar,
          "osVersion" varchar,
          "browserName" varchar,
          "browserVersion" varchar,
          "deviceModel" varchar,
          "sessionId" varchar,
          "utmSource" varchar,
          "utmMedium" varchar,
          "utmCampaign" varchar,
          "utmTerm" varchar,
          "utmContent" varchar,
          "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "fk_dynamic_link_click_events_dynamic_link" FOREIGN KEY ("dynamicLinkId")
            REFERENCES "blinkly_db_schema"."dynamic_links"("id")
      )
    `);

    // Create webhook_endpoints table
    await queryRunner.query(`
      CREATE TABLE "blinkly_db_schema"."webhook_endpoints" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "url" varchar NOT NULL,
          "events" text NOT NULL,
          "isActive" boolean NOT NULL DEFAULT true,
          "secret" varchar(255) UNIQUE NOT NULL,
          "failedAttempts" integer NOT NULL DEFAULT 0,
          "lastFailedAt" TIMESTAMP,
          "userId" uuid NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "fk_webhook_endpoints_user" FOREIGN KEY ("userId")
            REFERENCES "blinkly_db_schema"."users"("id")
      )
    `);

    // Add foreign key for activeSubscriptionId in users table
    await queryRunner.query(`
      ALTER TABLE "blinkly_db_schema"."users"
      ADD CONSTRAINT "fk_users_active_subscription"
      FOREIGN KEY ("activeSubscriptionId")
      REFERENCES "blinkly_db_schema"."user_subscriptions"("id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key for activeSubscriptionId in users table
    await queryRunner.query(`
      ALTER TABLE "blinkly_db_schema"."users" DROP CONSTRAINT "fk_users_active_subscription"
    `);

    // Drop tables in reverse order
    await queryRunner.query(
      `DROP TABLE "blinkly_db_schema"."webhook_endpoints"`,
    );
    await queryRunner.query(
      `DROP TABLE "blinkly_db_schema"."dynamic_link_click_events"`,
    );
    await queryRunner.query(`DROP TABLE "blinkly_db_schema"."dynamic_links"`);
    await queryRunner.query(`DROP TABLE "blinkly_db_schema"."qr_codes"`);
    await queryRunner.query(`DROP TABLE "blinkly_db_schema"."click_events"`);
    await queryRunner.query(`DROP TABLE "blinkly_db_schema"."links"`);
    await queryRunner.query(
      `DROP TABLE "blinkly_db_schema"."user_subscriptions"`,
    );
    await queryRunner.query(`DROP TABLE "blinkly_db_schema"."plans"`);
    await queryRunner.query(`DROP TABLE "blinkly_db_schema"."users"`);

    // Drop enum types
    await queryRunner.query(
      `DROP TYPE "blinkly_db_schema"."redirect_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "blinkly_db_schema"."plan_name_enum"`);
    await queryRunner.query(
      `DROP TYPE "blinkly_db_schema"."billing_frequency_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "blinkly_db_schema"."subscription_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "blinkly_db_schema"."user_role_enum"`);
  }
}
