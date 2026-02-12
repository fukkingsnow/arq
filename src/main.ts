import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import * as express from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. CORS — разрешаем запросы (полезно для разработки)
  app.enableCors();

  // 2. Префикс API
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  
  const staticPath = join(process.cwd(), 'dist/frontend');

  // 3. Обработка статики и SPA роутинга
  app.use((req, res, next) => {
    // Если запрос начинается с /api/v1, отдаем его NestJS
    if (req.url.startsWith('/api/v1')) {
      return next();
    }

    // Если статический файл существует — отдаем его
    express.static(staticPath)(req, res, () => {
      // Если файла нет, но это не API запрос — отдаем index.html (для React/Vue роутинга)
      const indexPath = join(staticPath, 'index.html');
      if (existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        // Если даже index.html нет, отдаем 404 или сообщение
        res.status(404).send('Frontend build not found. Run "npm run build" in frontend directory.');
      }
    });
  });

  // Слушаем на 0.0.0.0 для работы внутри Docker
  const port = 8000; 
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server ready at http://62.113.110.182:${port}/api/v1`);
  console.log(`📂 Serving static from: ${staticPath}`);
}
bootstrap();
