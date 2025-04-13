import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  database: process.env.DATABASE_NAME || 'blinkly_db',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  schema: process.env.DATABASE_SCHEMA || 'blinkly_db_schema',
  entities: ['src/entities/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
