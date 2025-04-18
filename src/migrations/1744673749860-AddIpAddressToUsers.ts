import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIpAddressToUsers1744673749860 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN ipAddress varchar(45);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN ip_address;
    `);
  }
}
