import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Префикс API v1
  app.setGlobalPrefix('api/v1');

  // Включаем CORS
  app.enableCors();

  // Валидация
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Раздача статики фронтенда
  const staticPath = join(process.cwd(), 'dist/frontend');
  app.use(express.static(staticPath));

  // Роутинг для Single Page Application (React/Vite)
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/v1')) {
      return next();
    }
    res.sendFile(join(staticPath, 'index.html'));
  });

  // Порт 8000
  await app.listen(8000, '0.0.0.0');
  
  console.log(`🚀 ARQ API & Frontend started on port 8000`);
}
bootstrap();
