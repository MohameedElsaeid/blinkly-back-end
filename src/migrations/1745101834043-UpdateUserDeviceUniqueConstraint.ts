import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserDeviceUniqueConstraint1745101834043
  implements MigrationInterface
{
  name = 'UpdateUserDeviceUniqueConstraint1745101834043';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing constraints
    await queryRunner.query(`
      ALTER TABLE "user_devices" 
      DROP CONSTRAINT IF EXISTS "UQ_user_devices_user_deviceId"
    `);

    // Add new unique constraint only on deviceId
    await queryRunner.query(`
      ALTER TABLE "user_devices" 
      ADD CONSTRAINT "UQ_user_devices_deviceId" 
      UNIQUE ("deviceId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the new constraint
    await queryRunner.query(`
      ALTER TABLE "user_devices" 
      DROP CONSTRAINT IF EXISTS "UQ_user_devices_deviceId"
    `);

    // Restore the original constraint
    await queryRunner.query(`
      ALTER TABLE "user_devices" 
      ADD CONSTRAINT "UQ_user_devices_user_deviceId" 
      UNIQUE ("userId", "deviceId")
    `);
  }
}
