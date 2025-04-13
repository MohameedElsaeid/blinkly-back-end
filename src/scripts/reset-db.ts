import { createConnection } from 'typeorm';
import { config } from 'dotenv';

config();

async function resetDatabase() {
  try {
    // First connect to postgres database to drop and create our database
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: 'postgres', // Connect to default postgres database
    });

    // Drop the database if it exists
    await connection.query(`DROP DATABASE IF EXISTS ${process.env.DATABASE_NAME}`);
    console.log('Dropped existing database');

    // Create a new database
    await connection.query(`CREATE DATABASE ${process.env.DATABASE_NAME}`);
    console.log('Created new database');

    await connection.close();
    console.log('Database reset completed');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase(); 