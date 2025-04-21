import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBrowserAndDeviceInfo1745101834044
  implements MigrationInterface
{
  name = 'AddBrowserAndDeviceInfo1745101834044';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add columns to click_events
    await queryRunner.query(`
      ALTER TABLE "click_events"
      ADD COLUMN IF NOT EXISTS "browser" character varying,
      ADD COLUMN IF NOT EXISTS "browserVersion" character varying,
      ADD COLUMN IF NOT EXISTS "os" character varying,
      ADD COLUMN IF NOT EXISTS "osVersion" character varying,
      ADD COLUMN IF NOT EXISTS "device" character varying,
      ADD COLUMN IF NOT EXISTS "deviceType" character varying,
      ADD COLUMN IF NOT EXISTS "queryParams" jsonb;
    `);

    // Add columns to dynamic_link_click_events
    await queryRunner.query(`
      ALTER TABLE "dynamic_link_click_events"
      ADD COLUMN IF NOT EXISTS "browser" character varying,
      ADD COLUMN IF NOT EXISTS "browserVersion" character varying,
      ADD COLUMN IF NOT EXISTS "os" character varying,
      ADD COLUMN IF NOT EXISTS "osVersion" character varying,
      ADD COLUMN IF NOT EXISTS "device" character varying,
      ADD COLUMN IF NOT EXISTS "deviceType" character varying,
      ADD COLUMN IF NOT EXISTS "queryParams" jsonb;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns from click_events
    await queryRunner.query(`
      ALTER TABLE "click_events"
      DROP COLUMN IF EXISTS "browser",
      DROP COLUMN IF EXISTS "browserVersion", 
      DROP COLUMN IF EXISTS "os",
      DROP COLUMN IF EXISTS "osVersion",
      DROP COLUMN IF EXISTS "device",
      DROP COLUMN IF EXISTS "deviceType",
      DROP COLUMN IF EXISTS "queryParams";
    `);

    // Remove columns from dynamic_link_click_events
    await queryRunner.query(`
      ALTER TABLE "dynamic_link_click_events"
      DROP COLUMN IF EXISTS "browser",
      DROP COLUMN IF EXISTS "browserVersion",
      DROP COLUMN IF EXISTS "os",
      DROP COLUMN IF EXISTS "osVersion",
      DROP COLUMN IF EXISTS "device",
      DROP COLUMN IF EXISTS "queryParams";
    `);
  }
}
