import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
    @Get('/')
  getRoot() {
    return {
      message: 'ARQ API is running successfully',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
}
