import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnalyticsColumns1745365601219 implements MigrationInterface {
  name = 'AddAnalyticsColumns1745365601219';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add session tracking
    await queryRunner.query(`
      ALTER TABLE "visits"
      ADD COLUMN "sessionId" uuid,
      ADD COLUMN "sessionStartTime" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN "sessionEndTime" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN "sessionDuration" integer;
    `);

    // Add UTM tracking columns to click events
    await queryRunner.query(`
      ALTER TABLE "click_events"
      ADD COLUMN "sessionId" uuid,
      ADD COLUMN "utmSource" varchar(100),
      ADD COLUMN "utmMedium" varchar(100),
      ADD COLUMN "utmCampaign" varchar(100),
      ADD COLUMN "utmTerm" varchar(100),
      ADD COLUMN "utmContent" varchar(100),
      ADD COLUMN "qrCodeId" uuid,
      ADD COLUMN "statusCode" integer,
      ADD COLUMN "responseTime" integer,
      ADD COLUMN "bounced" boolean DEFAULT false,
      ADD COLUMN "conversionType" varchar(50),
      ADD COLUMN "conversionValue" decimal(10,2),
      ADD COLUMN "referrerDomain" varchar(255);
    `);

    // Add foreign key for QR code tracking
    await queryRunner.query(`
      ALTER TABLE "click_events"
      ADD CONSTRAINT "FK_click_events_qr_code"
      FOREIGN KEY ("qrCodeId") 
      REFERENCES "qr_codes"("id") 
      ON DELETE SET NULL;
    `);

    // Add the same columns to dynamic link click events
    await queryRunner.query(`
      ALTER TABLE "dynamic_link_click_events"
      ADD COLUMN "sessionId" uuid,
      ADD COLUMN "utmSource" varchar(100),
      ADD COLUMN "utmMedium" varchar(100),
      ADD COLUMN "utmCampaign" varchar(100),
      ADD COLUMN "utmTerm" varchar(100),
      ADD COLUMN "utmContent" varchar(100),
      ADD COLUMN "qrCodeId" uuid,
      ADD COLUMN "statusCode" integer,
      ADD COLUMN "responseTime" integer,
      ADD COLUMN "bounced" boolean DEFAULT false,
      ADD COLUMN "conversionType" varchar(50),
      ADD COLUMN "conversionValue" decimal(10,2),
      ADD COLUMN "referrerDomain" varchar(255);
    `);

    // Add foreign key for QR code tracking in dynamic links
    await queryRunner.query(`
      ALTER TABLE "dynamic_link_click_events"
      ADD CONSTRAINT "FK_dynamic_link_click_events_qr_code"
      FOREIGN KEY ("qrCodeId") 
      REFERENCES "qr_codes"("id") 
      ON DELETE SET NULL;
    `);

    // Add indexes for performance
    await queryRunner.query(`
      CREATE INDEX "idx_click_events_session" ON "click_events" ("sessionId");
      CREATE INDEX "idx_click_events_utm" ON "click_events" ("utmSource", "utmMedium", "utmCampaign");
      CREATE INDEX "idx_click_events_qr" ON "click_events" ("qrCodeId");
      CREATE INDEX "idx_click_events_conversion" ON "click_events" ("conversionType");
      CREATE INDEX "idx_dynamic_click_events_session" ON "dynamic_link_click_events" ("sessionId");
      CREATE INDEX "idx_dynamic_click_events_utm" ON "dynamic_link_click_events" ("utmSource", "utmMedium", "utmCampaign");
      CREATE INDEX "idx_dynamic_click_events_qr" ON "dynamic_link_click_events" ("qrCodeId");
      CREATE INDEX "idx_dynamic_click_events_conversion" ON "dynamic_link_click_events" ("conversionType");
      CREATE INDEX "idx_visits_session" ON "visits" ("sessionId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_click_events_session";
      DROP INDEX IF EXISTS "idx_click_events_utm";
      DROP INDEX IF EXISTS "idx_click_events_qr";
      DROP INDEX IF EXISTS "idx_click_events_conversion";
      DROP INDEX IF EXISTS "idx_dynamic_click_events_session";
      DROP INDEX IF EXISTS "idx_dynamic_click_events_utm";
      DROP INDEX IF EXISTS "idx_dynamic_click_events_qr";
      DROP INDEX IF EXISTS "idx_dynamic_click_events_conversion";
      DROP INDEX IF EXISTS "idx_visits_session";
    `);

    // Remove foreign keys
    await queryRunner.query(`
      ALTER TABLE "click_events" DROP CONSTRAINT IF EXISTS "FK_click_events_qr_code";
      ALTER TABLE "dynamic_link_click_events" DROP CONSTRAINT IF EXISTS "FK_dynamic_link_click_events_qr_code";
    `);

    // Remove columns from click_events
    await queryRunner.query(`
      ALTER TABLE "click_events"
      DROP COLUMN IF EXISTS "sessionId",
      DROP COLUMN IF EXISTS "utmSource",
      DROP COLUMN IF EXISTS "utmMedium",
      DROP COLUMN IF EXISTS "utmCampaign",
      DROP COLUMN IF EXISTS "utmTerm",
      DROP COLUMN IF EXISTS "utmContent",
      DROP COLUMN IF EXISTS "qrCodeId",
      DROP COLUMN IF EXISTS "statusCode",
      DROP COLUMN IF EXISTS "responseTime",
      DROP COLUMN IF EXISTS "bounced",
      DROP COLUMN IF EXISTS "conversionType",
      DROP COLUMN IF EXISTS "conversionValue",
      DROP COLUMN IF EXISTS "referrerDomain";
    `);

    // Remove columns from dynamic_link_click_events
    await queryRunner.query(`
      ALTER TABLE "dynamic_link_click_events"
      DROP COLUMN IF EXISTS "sessionId",
      DROP COLUMN IF EXISTS "utmSource",
      DROP COLUMN IF EXISTS "utmMedium",
      DROP COLUMN IF EXISTS "utmCampaign",
      DROP COLUMN IF EXISTS "utmTerm",
      DROP COLUMN IF EXISTS "utmContent",
      DROP COLUMN IF EXISTS "qrCodeId",
      DROP COLUMN IF EXISTS "statusCode",
      DROP COLUMN IF EXISTS "responseTime",
      DROP COLUMN IF EXISTS "bounced",
      DROP COLUMN IF EXISTS "conversionType",
      DROP COLUMN IF EXISTS "conversionValue",
      DROP COLUMN IF EXISTS "referrerDomain";
    `);

    // Remove columns from visits
    await queryRunner.query(`
      ALTER TABLE "visits"
      DROP COLUMN IF EXISTS "sessionId",
      DROP COLUMN IF EXISTS "sessionStartTime",
      DROP COLUMN IF EXISTS "sessionEndTime",
      DROP COLUMN IF EXISTS "sessionDuration";
    `);
  }
}
