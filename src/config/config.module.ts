import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

/**
 * Configuration Module
 * Manages environment variables and application configuration.
 * Validates configuration using Joi schema validation.
 * Supports different environment profiles (development, staging, production).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
        PORT: Joi.number().default(3000),
        DB_HOST: Joi.string().default('localhost'),
        DB_PORT: Joi.number().default(5432),
        DB_USER: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        DB_LOGGING: Joi.boolean().default(false),
        DB_SSL: Joi.boolean().default(false),
        JWT_SECRET: Joi.string().required(),
        CORS_ORIGIN: Joi.string().default('*'),
      }),
      validationOptions: { abortEarly: false, allowUnknown: true },
      cache: true,
    }),
  ],
  exports: [ConfigModule],
})
export class ConfigModuleWrapper {}
