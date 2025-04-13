export default () => ({
  port: Number(process.env.PORT) || 3000,
  database: {
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
    ssl: true,
    synchronize: false,
    logging: false,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '1d',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW) || 900000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
});
