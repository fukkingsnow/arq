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
 */

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // В продакшене лучше оставить только важные логи
    logger: process.env.NODE_ENV === 'production' 
      ? ['error', 'warn', 'log'] 
      : ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('ARQ Backend');

  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const port = configService.get<number>('PORT', 8000);
  const apiVersion = configService.get<string>('API_VERSION', 'v1');

  // Security
  app.use(helmet({
    crossOriginEmbedderPolicy: false, // Нужно, если грузишь внешние скрипты/ресурсы
  }));

  // CORS
  app.use(cors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    credentials: true,
  }));

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix(`api/${apiVersion}`);

  // Static files (Frontend)
  // Убедись, что путь корректен относительно dist/main.js
  const frontendPath = join(__dirname, '..', 'frontend', 'dist');
  app.use('/', express.static(frontendPath));

  // Запуск на всех интерфейсах (важно для Docker/Cloud)
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 ARQ Assistant started on port ${port} [${nodeEnv}]`);
}

bootstrap().catch((error) => {
  console.error('Bootstrap error:', error);
  process.exit(1);
});
