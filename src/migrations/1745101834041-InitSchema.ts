import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1745101834041 implements MigrationInterface {
  name = 'InitSchema1745101834041';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "public"."visits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" uuid, "userDeviceId" uuid NOT NULL, "host" character varying, "cfRay" character varying, "requestTime" TIMESTAMP WITH TIME ZONE, "xDeviceMemory" integer, "requestId" character varying, "acceptEncoding" character varying, "xPlatform" character varying, "xForwardedProto" character varying, "xLanguage" character varying, "cfVisitorScheme" character varying, "cfIpCountry" character varying, "geoCountry" character varying, "geoCity" character varying, "geoLatitude" numeric(9,6), "geoLongitude" numeric(9,6), "xFbClickId" character varying, "xFbBrowserId" character varying, "cfConnectingO2O" character varying, "contentLength" integer, "xForwardedFor" character varying, "xXsrfToken" character varying, "xUserAgent" character varying, "xTimeZone" character varying, "xScreenWidth" integer, "xScreenHeight" integer, "xRequestedWith" character varying, "contentType" character varying, "cfEwVia" character varying, "cdnLoop" character varying, "acceptLanguage" character varying, "accept" character varying, "cacheControl" character varying, "referer" character varying, "userAgent" character varying, "cfConnectingIp" character varying, "deviceId" character varying, "dnt" character varying, "origin" character varying, "priority" character varying, "secChUa" character varying, "secChUaMobile" character varying, "secChUaPlatform" character varying, "secFetchDest" character varying, "secFetchMode" character varying, "secFetchSite" character varying, "xClientFeatures" character varying, "xColorDepth" integer, "xCsrfToken" character varying, "xCustomHeader" character varying, "xDeviceId" character varying, "doConnectingIp" character varying, "browser" character varying, "browserVersion" character varying, "os" character varying, "osVersion" character varying, "device" character varying, "deviceType" character varying, "queryParams" jsonb, CONSTRAINT "PK_0b0b322289a41015c6ea4e8bf30" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "public"."user_devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "deviceId" character varying NOT NULL, "xDeviceId" character varying NOT NULL, "xDeviceMemory" integer, "xHardwareConcurrency" integer, "xPlatform" character varying, "xScreenWidth" integer, "xScreenHeight" integer, "xColorDepth" integer, "xTimeZone" character varying, CONSTRAINT "PK_c9e7e648903a9e537347aba4371" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "public"."dynamic_link_click_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" uuid, "userDeviceId" uuid NOT NULL, "dynamicLinkId" uuid NOT NULL, "host" character varying, "cfRay" character varying, "requestTime" TIMESTAMP WITH TIME ZONE, "xDeviceMemory" integer, "requestId" character varying, "acceptEncoding" character varying, "xPlatform" character varying, "xForwardedProto" character varying, "xLanguage" character varying, "cfVisitorScheme" character varying, "cfIpCountry" character varying, "geoCountry" character varying, "geoCity" character varying, "geoLatitude" numeric(9,6), "geoLongitude" numeric(9,6), "xFbClickId" character varying, "xFbBrowserId" character varying, "cfConnectingO2O" character varying, "contentLength" integer, "xForwardedFor" character varying, "xXsrfToken" character varying, "xUserAgent" character varying, "xTimeZone" character varying, "xScreenWidth" integer, "xScreenHeight" integer, "xRequestedWith" character varying, "contentType" character varying, "cfEwVia" character varying, "cdnLoop" character varying, "acceptLanguage" character varying, "accept" character varying, "cacheControl" character varying, "referer" character varying, "userAgent" character varying, "cfConnectingIp" character varying, "deviceId" character varying, "dnt" character varying, "origin" character varying, "priority" character varying, "secChUa" character varying, "secChUaMobile" character varying, "secChUaPlatform" character varying, "secFetchDest" character varying, "secFetchMode" character varying, "secFetchSite" character varying, "xClientFeatures" character varying, "xColorDepth" integer, "xCsrfToken" character varying, "xCustomHeader" character varying, "xDeviceId" character varying, "doConnectingIp" character varying, CONSTRAINT "PK_26753feedabec71c46508a12bfa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "public"."dynamic_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "alias" character varying NOT NULL, "defaultUrl" character varying NOT NULL, "rules" jsonb NOT NULL, "utmParameters" jsonb, "metaTitle" character varying, "metaDescription" character varying, "metaImage" character varying, "isActive" boolean NOT NULL DEFAULT true, "tags" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "UQ_dd0d6508d78c1d6b2ba4633a634" UNIQUE ("alias"), CONSTRAINT "PK_7d92113638136a8e19d444c7702" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "public"."click_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "timestamp" TIMESTAMP WITH TIME ZONE, "userId" uuid, "userDeviceId" uuid, "linkId" uuid NOT NULL, "host" character varying, "cfRay" character varying, "requestTime" TIMESTAMP WITH TIME ZONE, "xDeviceMemory" integer, "requestId" character varying, "acceptEncoding" character varying, "xPlatform" character varying, "xForwardedProto" character varying, "xLanguage" character varying, "cfVisitorScheme" character varying, "cfIpCountry" character varying, "geoCountry" character varying, "geoCity" character varying, "geoLatitude" numeric(9,6), "geoLongitude" numeric(9,6), "xFbClickId" character varying, "xFbBrowserId" character varying, "cfConnectingO2O" character varying, "contentLength" integer, "xForwardedFor" character varying, "xXsrfToken" character varying, "xUserAgent" character varying, "xTimeZone" character varying, "xScreenWidth" integer, "xScreenHeight" integer, "xRequestedWith" character varying, "contentType" character varying, "cfEwVia" character varying, "cdnLoop" character varying, "acceptLanguage" character varying, "accept" character varying, "cacheControl" character varying, "referer" character varying, "userAgent" character varying, "cfConnectingIp" character varying, "deviceId" character varying, "dnt" character varying, "origin" character varying, "priority" character varying, "secChUa" character varying, "secChUaMobile" character varying, "secChUaPlatform" character varying, "secFetchDest" character varying, "secFetchMode" character varying, "secFetchSite" character varying, "xClientFeatures" character varying, "xColorDepth" integer, "xCsrfToken" character varying, "xCustomHeader" character varying, "xDeviceId" character varying, "doConnectingIp" character varying, CONSTRAINT "PK_2e3b14f5049a9fdbd8c9b1b10bf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "public"."qr_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "targetUrl" character varying NOT NULL, "size" integer NOT NULL DEFAULT '300', "color" character varying(7) NOT NULL DEFAULT '#000000', "backgroundColor" character varying(7) NOT NULL DEFAULT '#FFFFFF', "logoUrl" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "linkId" uuid, "userId" uuid, CONSTRAINT "PK_4b7aa338e150a878ce9e2c55c5c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."links_redirecttype_enum" AS ENUM('301', '302')`,
    );
    await queryRunner.query(
      `CREATE TABLE "public"."links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "originalUrl" character varying NOT NULL, "alias" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "tags" text, "clickCount" integer NOT NULL DEFAULT '0', "redirectType" "public"."links_redirecttype_enum" NOT NULL DEFAULT '302', "expiresAt" TIMESTAMP, "metaTitle" character varying(255), "metaDescription" text, "metaImage" character varying(255), "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "UQ_5a2507a408bd33a2431ebc48f86" UNIQUE ("alias"), CONSTRAINT "PK_ecf17f4a741d3c5ba0b4c5ab4b6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plans_name_enum" AS ENUM('FREE', 'BASIC', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plans_billingfrequency_enum" AS ENUM('monthly', 'yearly')`,
    );
    await queryRunner.query(
      `CREATE TABLE "public"."plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" "public"."plans_name_enum" NOT NULL, "billingFrequency" "public"."plans_billingfrequency_enum" NOT NULL, "price" integer, "description" character varying(255), "features" text, "shortenedLinksLimit" integer, "qrCodesLimit" integer, "freeTrialAvailable" boolean NOT NULL DEFAULT false, "freeTrialDays" integer, "isMostPopular" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_subscriptions_status_enum" AS ENUM('active', 'trial', 'cancelled', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TABLE "public"."user_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "startDate" TIMESTAMP WITH TIME ZONE NOT NULL, "endDate" TIMESTAMP WITH TIME ZONE, "status" "public"."user_subscriptions_status_enum" NOT NULL DEFAULT 'trial', "stripeSubscriptionId" character varying(255), "stripeCustomerId" character varying(255), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid, "planId" uuid, CONSTRAINT "PK_9e928b0954e51705ab44988812c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "public"."users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying(50) NOT NULL, "lastName" character varying(50) NOT NULL, "email" character varying(255) NOT NULL, "countryCode" character varying(10) NOT NULL, "phoneNumber" character varying(20) NOT NULL, "password" character varying(255) NOT NULL, "ipAddress" character varying(45), "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', "isActive" boolean NOT NULL DEFAULT true, "isEmailVerified" boolean NOT NULL DEFAULT false, "isPhoneVerified" boolean NOT NULL DEFAULT false, "dateOfBirth" date, "address" character varying(255), "city" character varying(100), "postalCode" character varying(20), "profilePicture" character varying(255), "bio" text, "preferredLanguage" character varying(10) NOT NULL DEFAULT 'en', "timezone" character varying(50) NOT NULL DEFAULT 'UTC', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "activeSubscriptionId" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "REL_6bad25ae49d5d94043062f912b" UNIQUE ("activeSubscriptionId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "public"."webhook_endpoints" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "events" text NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "secret" character varying(255) NOT NULL, "failedAttempts" integer NOT NULL DEFAULT '0', "lastFailedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "UQ_94337b83da05cccf80e967580c0" UNIQUE ("secret"), CONSTRAINT "PK_054c4cfb95223732f5939d2d546" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."visits" ADD CONSTRAINT "FK_28f19616757b505532162fd6e75" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."visits" ADD CONSTRAINT "FK_8c53188ba68a6aa25af8af85407" FOREIGN KEY ("userDeviceId") REFERENCES "public"."user_devices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user_devices" ADD CONSTRAINT "FK_e12ac4f8016243ac71fd2e415af" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."dynamic_link_click_events" ADD CONSTRAINT "FK_b3d432c73e6dd8c2b5349ae2e2d" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."dynamic_link_click_events" ADD CONSTRAINT "FK_52b6641f6b80b9bc6127bc929e6" FOREIGN KEY ("userDeviceId") REFERENCES "public"."user_devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."dynamic_link_click_events" ADD CONSTRAINT "FK_79ff286d9a3b824be4a1fcbe2f7" FOREIGN KEY ("dynamicLinkId") REFERENCES "public"."dynamic_links"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."dynamic_links" ADD CONSTRAINT "FK_6980cf6985bb7c3b0a522458eab" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."click_events" ADD CONSTRAINT "FK_6b22981c806282f2dbd4128b053" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."click_events" ADD CONSTRAINT "FK_0cd8981046e6473f680e6e45ab8" FOREIGN KEY ("userDeviceId") REFERENCES "public"."user_devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."click_events" ADD CONSTRAINT "FK_a575423ed8d1710f659b4d788c5" FOREIGN KEY ("linkId") REFERENCES "public"."links"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."qr_codes" ADD CONSTRAINT "FK_6e1d60e5946560526825f786c43" FOREIGN KEY ("linkId") REFERENCES "public"."links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."qr_codes" ADD CONSTRAINT "FK_9f6c6ff04146916ebc16a2581bd" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."links" ADD CONSTRAINT "FK_56668229b541edc1d0e291b4c3b" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user_subscriptions" ADD CONSTRAINT "FK_2dfab576863bc3f84d4f6962274" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user_subscriptions" ADD CONSTRAINT "FK_55c9f77733123bd2ead29886017" FOREIGN KEY ("planId") REFERENCES "public"."plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."users" ADD CONSTRAINT "FK_6bad25ae49d5d94043062f912b8" FOREIGN KEY ("activeSubscriptionId") REFERENCES "public"."user_subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."webhook_endpoints" ADD CONSTRAINT "FK_fd866edd4a9cf92aec0901ce4dc" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "public"."webhook_endpoints" DROP CONSTRAINT "FK_fd866edd4a9cf92aec0901ce4dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."users" DROP CONSTRAINT "FK_6bad25ae49d5d94043062f912b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user_subscriptions" DROP CONSTRAINT "FK_55c9f77733123bd2ead29886017"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user_subscriptions" DROP CONSTRAINT "FK_2dfab576863bc3f84d4f6962274"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."links" DROP CONSTRAINT "FK_56668229b541edc1d0e291b4c3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."qr_codes" DROP CONSTRAINT "FK_9f6c6ff04146916ebc16a2581bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."qr_codes" DROP CONSTRAINT "FK_6e1d60e5946560526825f786c43"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."click_events" DROP CONSTRAINT "FK_a575423ed8d1710f659b4d788c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."click_events" DROP CONSTRAINT "FK_0cd8981046e6473f680e6e45ab8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."click_events" DROP CONSTRAINT "FK_6b22981c806282f2dbd4128b053"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."dynamic_links" DROP CONSTRAINT "FK_6980cf6985bb7c3b0a522458eab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."dynamic_link_click_events" DROP CONSTRAINT "FK_79ff286d9a3b824be4a1fcbe2f7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."dynamic_link_click_events" DROP CONSTRAINT "FK_52b6641f6b80b9bc6127bc929e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."dynamic_link_click_events" DROP CONSTRAINT "FK_b3d432c73e6dd8c2b5349ae2e2d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user_devices" DROP CONSTRAINT "FK_e12ac4f8016243ac71fd2e415af"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."visits" DROP CONSTRAINT "FK_8c53188ba68a6aa25af8af85407"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."visits" DROP CONSTRAINT "FK_28f19616757b505532162fd6e75"`,
    );
    await queryRunner.query(`DROP TABLE "public"."webhook_endpoints"`);
    await queryRunner.query(`DROP TABLE "public"."users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "public"."user_subscriptions"`);
    await queryRunner.query(
      `DROP TYPE "public"."user_subscriptions_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "public"."plans"`);
    await queryRunner.query(`DROP TYPE "public"."plans_billingfrequency_enum"`);
    await queryRunner.query(`DROP TYPE "public"."plans_name_enum"`);
    await queryRunner.query(`DROP TABLE "public"."links"`);
    await queryRunner.query(`DROP TYPE "public"."links_redirecttype_enum"`);
    await queryRunner.query(`DROP TABLE "public"."qr_codes"`);
    await queryRunner.query(`DROP TABLE "public"."click_events"`);
    await queryRunner.query(`DROP TABLE "public"."dynamic_links"`);
    await queryRunner.query(`DROP TABLE "public"."dynamic_link_click_events"`);
    await queryRunner.query(`DROP TABLE "public"."user_devices"`);
    await queryRunner.query(`DROP TABLE "public"."visits"`);
  }
}
