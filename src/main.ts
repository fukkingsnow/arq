// Fix for TypeORM crypto issue - import and make crypto globally available
import * as crypto from 'crypto';
(global as any).crypto = crypto;

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import helmet from 'helmet';
import cors from 'cors';
import * as express from 'express';
import { join } from 'path';


/**
 * ARQ Backend - Main Application Bootstrap
 * Phase 21: Core Infrastructure & Networking
 * Production-ready configuration for AI Assistant Backend
 */

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('ARQ Backend');

  // Environment Configuration
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const port = configService.get<number>('PORT', 8000);
  const apiVersion = configService.get<string>('API_VERSION', 'v1');
  const dbHost = configService.get<string>('DB_HOST', 'localhost');

  // Security: Helmet Protection
  app.use(helmet());

  // CORS Configuration
  const corsOptions = {
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // API Prefix
  app.setGlobalPrefix(`api/${apiVersion}`);

  // Swagger Documentation (Development only)
  if (nodeEnv === 'development') {
    logger.debug('Swagger docs available at /api/docs');
  }

  // Listen on configured port
// Serve static files (frontend)

    // Serve frontend static files
  app.use('/', express.static(join(__dirname, '..', 'frontend')));

  
  await app.listen(port, '0.0.0.0');

  logger.log(`========================================`);
  logger.log(`ARQ Backend - AI Assistant Service`);
  logger.log(`Environment: ${nodeEnv}`);
  logger.log(`API Version: ${apiVersion}`);
  logger.log(`Running on: http://localhost:${port}`);
  logger.log(`Database: ${dbHost}`);
  logger.log(`Listening on port: ${port}`);
  logger.log(`========================================`);
}

bootstrap().catch((error) => {
  console.error('Bootstrap error:', error);
  process.exit(1);
});


