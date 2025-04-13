import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Node environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USERNAME: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_SSL: Joi.boolean().default(false),

  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),

  // JWT
  JWT_SECRET: Joi.string().required().min(32),

  // Stripe
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),

  // CORS
  ALLOWED_ORIGINS: Joi.string().default('*'),

  // Rate Limiting
  RATE_LIMIT_WINDOW: Joi.number().default(900000),
  RATE_LIMIT_MAX: Joi.number().default(100),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  LOG_FORMAT: Joi.string().valid('json', 'pretty').default('json'),
});
