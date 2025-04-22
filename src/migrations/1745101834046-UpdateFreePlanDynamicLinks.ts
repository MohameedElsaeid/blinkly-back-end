import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateFreePlanDynamicLinks1745101834046
  implements MigrationInterface
{
  name = 'UpdateFreePlanDynamicLinks1745101834046';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "public"."plans"
      SET "features" = '10 shortened links/month\n1 dynamic link/month\n2 QR codes/month\nCommunity support'
      WHERE "name" = 'FREE' AND ("billingFrequency" = 'monthly' OR "billingFrequency" = 'yearly');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "public"."plans"
      SET "features" = '10 shortened links/month\n2 QR codes/month\nCommunity support'
      WHERE "name" = 'FREE' AND ("billingFrequency" = 'monthly' OR "billingFrequency" = 'yearly');
    `);
  }
}
