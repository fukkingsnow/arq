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
  
  // Важно: Сначала статика, потом префикс!
  app.use(express.static(staticPath));
  
  app.setGlobalPrefix('api/v1');

  // Если это не API и не статический файл, принудительно отдаем index.html
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/v1')) return next();
    res.sendFile(join(staticPath, 'index.html'));
  });

  await app.listen(port, '0.0.0.0');
}
bootstrap();
