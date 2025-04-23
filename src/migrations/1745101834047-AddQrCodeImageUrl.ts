import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQrCodeImageUrl1745101834047 implements MigrationInterface {
  name = 'AddQrCodeImageUrl1745101834047';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "qr_codes"
      ADD COLUMN "imageUrl" character varying(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "qr_codes"
      DROP COLUMN "imageUrl"
    `);
  }
}
