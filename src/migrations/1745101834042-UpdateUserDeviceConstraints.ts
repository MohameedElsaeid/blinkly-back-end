import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserDeviceConstraints1745101834042
  implements MigrationInterface
{
  name = 'UpdateUserDeviceConstraints1745101834042';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the existing unique constraint
    await queryRunner.query(`
      ALTER TABLE "user_devices" 
      DROP CONSTRAINT IF EXISTS "UQ_user_devices_user_deviceId_xDeviceId"
    `);

    // Make xDeviceId nullable
    await queryRunner.query(`
      ALTER TABLE "user_devices" 
      ALTER COLUMN "xDeviceId" DROP NOT NULL
    `);

    // Add new unique constraint only on userId and deviceId
    await queryRunner.query(`
      ALTER TABLE "user_devices" 
      ADD CONSTRAINT "UQ_user_devices_user_deviceId" 
      UNIQUE ("userId", "deviceId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the new unique constraint
    await queryRunner.query(`
      ALTER TABLE "user_devices" 
      DROP CONSTRAINT IF EXISTS "UQ_user_devices_user_deviceId"
    `);

    // Make xDeviceId non-nullable again
    await queryRunner.query(`
      ALTER TABLE "user_devices" 
      ALTER COLUMN "xDeviceId" SET NOT NULL
    `);

    // Restore the original unique constraint
    await queryRunner.query(`
      ALTER TABLE "user_devices" 
      ADD CONSTRAINT "UQ_user_devices_user_deviceId_xDeviceId" 
      UNIQUE ("userId", "deviceId", "xDeviceId")
    `);
  }
}
