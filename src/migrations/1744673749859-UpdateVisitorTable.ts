import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateVisitorTable1744673749859 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE visitors
      ADD COLUMN accept_encoding text,
      ADD COLUMN accept_language text,
      ADD COLUMN cd_loop text,
      ADD COLUMN cf_connecting_ip text,
      ADD COLUMN cf_country text,
      ADD COLUMN cf_ray text,
      ADD COLUMN cf_visitor text,
      ADD COLUMN content_type text,
      ADD COLUMN dnt text,
      ADD COLUMN host text,
      ADD COLUMN language text,
      ADD COLUMN origin text,
      ADD COLUMN priority text,
      ADD COLUMN referer text,
      ADD COLUMN request_id text,
      ADD COLUMN sec_ch_ua text,
      ADD COLUMN sec_ch_ua_mobile text,
      ADD COLUMN sec_ch_ua_platform text,
      ADD COLUMN sec_fetch_dest text,
      ADD COLUMN sec_fetch_mode text,
      ADD COLUMN sec_fetch_site text,
      ADD COLUMN color_depth text,
      ADD COLUMN device_memory text,
      ADD COLUMN hardware_concurrency text,
      ADD COLUMN platform text,
      ADD COLUMN screen_height text,
      ADD COLUMN screen_width text,
      ADD COLUMN time_zone text;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE visitors
      DROP COLUMN accept_encoding,
      DROP COLUMN accept_language,
      DROP COLUMN cd_loop,
      DROP COLUMN cf_connecting_ip,
      DROP COLUMN cf_country,
      DROP COLUMN cf_ray,
      DROP COLUMN cf_visitor,
      DROP COLUMN content_type,
      DROP COLUMN dnt,
      DROP COLUMN host,
      DROP COLUMN language,
      DROP COLUMN origin,
      DROP COLUMN priority,
      DROP COLUMN referer,
      DROP COLUMN request_id,
      DROP COLUMN sec_ch_ua,
      DROP COLUMN sec_ch_ua_mobile,
      DROP COLUMN sec_ch_ua_platform,
      DROP COLUMN sec_fetch_dest,
      DROP COLUMN sec_fetch_mode,
      DROP COLUMN sec_fetch_site,
      DROP COLUMN color_depth,
      DROP COLUMN device_memory,
      DROP COLUMN hardware_concurrency,
      DROP COLUMN platform,
      DROP COLUMN screen_height,
      DROP COLUMN screen_width,
      DROP COLUMN time_zone;
    `);
  }
}
