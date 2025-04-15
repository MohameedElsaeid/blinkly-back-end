import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVisitorTrackingTable1744673749858
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the visitors table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        deviceId text,
        fingerprint text,
        ipAddress text,
        userAgent text,
        browser text,
        browserVersion text,
        os text,
        osVersion text,
        device text,
        deviceType text,
        country text,
        region text,
        city text,
        latitude decimal(9,6),
        longitude decimal(9,6),
        visitCount integer DEFAULT 1,
        lastVisit timestamp,
        userId uuid REFERENCES users(id) ON DELETE CASCADE,
        createdAt timestamp with time zone DEFAULT now(),
        updatedAt timestamp with time zone DEFAULT now()
      );
    `);

    // Optionally enable Row Level Security if required
    await queryRunner.query(`ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Dropping the table will remove the associated RLS settings
    await queryRunner.query(`DROP TABLE IF EXISTS visitors;`);
  }
}
