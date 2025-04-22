import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanUpUserDevicesDuplicates1620308341000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "user_devices"
      WHERE "id"::text NOT IN (
        SELECT MIN("id"::text)
        FROM "user_devices"
        GROUP BY "userId", "deviceId", "xDeviceId"
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
