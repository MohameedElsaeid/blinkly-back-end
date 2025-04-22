import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePlansEntity1745365601218 implements MigrationInterface {
  name = 'UpdatePlansEntity1745365601218';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "plans" ADD "dynamicLinksLimit" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "plans" DROP COLUMN "dynamicLinksLimit"`,
    );
  }
}
