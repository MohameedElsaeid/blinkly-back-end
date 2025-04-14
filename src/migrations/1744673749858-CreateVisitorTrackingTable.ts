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

    // Enable Row Level Security on the visitors table
    await queryRunner.query(`ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;`);

    // Create policies for authenticated users
    await queryRunner.query(`
      CREATE POLICY "Users can read own visitors"
      ON visitors
      FOR SELECT
      TO authenticated
      USING (auth.uid() = userId);
    `);

    await queryRunner.query(`
      CREATE POLICY "Users can insert own visitors"
      ON visitors
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = userId);
    `);

    await queryRunner.query(`
      CREATE POLICY "Users can update own visitors"
      ON visitors
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = userId);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Dropping the table will automatically drop the policies.
    await queryRunner.query(`DROP TABLE IF EXISTS visitors;`);
  }
}
