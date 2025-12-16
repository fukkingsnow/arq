import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootController {
  @Get()
  getRoot() {
    return {
      service: 'ARQ Self-Development Engine',
      version: '1.0.0',
      status: 'operational',
      timestamp: new Date(),
      endpoints: [
        { 'POST /api/v1/arq/start-development': 'Start a new development cycle' },
        { 'GET /api/v1/arq/health': 'Check service health' },
        { 'GET /api/v1/arq/tasks': 'Get all development tasks' },
        { 'GET /api/v1/arq/tasks/:taskId': 'Get specific task status' },
      ],
    };
  }
}
