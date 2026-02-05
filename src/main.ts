import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. Глобальный префикс ДОЛЖЕН быть первым
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  
  const staticPath = '/opt/arq/src/frontend/dist';

  // 2. Явно обрабатываем статику, ИГНОРИРУЯ запросы к API
  app.use('/', (req, res, next) => {
    if (req.url.startsWith('/api/v1')) {
      return next(); // Пропускаем к контроллерам NestJS
    }
    // Проверяем, есть ли такой статический файл
    express.static(staticPath)(req, res, () => {
      // Если файла нет и это не API — отдаем index.html (для SPA роутинга)
      res.sendFile(join(staticPath, 'index.html'));
    });
  });

  await app.listen(8000, '0.0.0.0');
}
bootstrap();
