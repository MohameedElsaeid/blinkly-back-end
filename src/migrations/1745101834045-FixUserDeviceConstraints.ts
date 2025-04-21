import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUserDeviceConstraints1745101834045
  implements MigrationInterface
{
  name = 'FixUserDeviceConstraints1745101834045';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing constraints
    await queryRunner.query(`
      ALTER TABLE "user_devices" 
      DROP CONSTRAINT IF EXISTS "UQ_user_devices_deviceId";
    `);

    // Add new unique constraint on deviceId and userId
    await queryRunner.query(`
      ALTER TABLE "user_devices" 
      ADD CONSTRAINT "UQ_user_devices_deviceId_userId" 
      UNIQUE ("deviceId", "userId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop new constraint
    await queryRunner.query(`
      ALTER TABLE "user_devices" 
      DROP CONSTRAINT IF EXISTS "UQ_user_devices_deviceId_userId";
    `);

    // Restore original constraint
    await queryRunner.query(`
      ALTER TABLE "user_devices" 
      ADD CONSTRAINT "UQ_user_devices_deviceId" 
      UNIQUE ("deviceId");
    `);
  }
}
