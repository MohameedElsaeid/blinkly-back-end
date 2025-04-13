import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { RedisClientOptions } from 'redis';

interface Configuration {
  port: number;
  database: TypeOrmModuleOptions;
  redis: RedisClientOptions;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  stripe: {
    secretKey: string;
    webhookSecret: string;
  };
  cache: CacheModuleOptions;
  throttle: ThrottlerModuleOptions;
}

export default (): Configuration => ({
  port: Number(process.env.PORT) || 5147,
  database: {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'blinkly_db',
    schema: process.env.DATABASE_SCHEMA || 'blinkly_db',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV !== 'production',
    ssl: process.env.DATABASE_SSL === 'true',
  },
  redis: {
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '1d',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  cache: {
    ttl: 300,
    max: 100,
  },
  throttle: [
    {
      ttl: 60,
      limit: 10,
    },
    {
      ttl: 3600,
      limit: 1000,
    },
  ],
});
