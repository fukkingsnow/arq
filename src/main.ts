import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 8000);
  const staticPath = '/opt/arq/src/frontend/dist';

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // 1. Сначала задаем префикс для API
  app.setGlobalPrefix('api/v1');

  // 2. Включаем статику
  app.use(express.static(staticPath));

  // 3. SPA-поддержка: отдаем index.html только если это НЕ запрос к API
  // и НЕ запрос к существующему статическому файлу
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/v1')) {
      return next(); // Даем NestJS обработать API
    }
    // Для всего остального отдаем фронтенд
    res.sendFile(join(staticPath, 'index.html'));
  });

  await app.listen(port, '0.0.0.0');
}
bootstrap();
