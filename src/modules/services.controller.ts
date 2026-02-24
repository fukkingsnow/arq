import { Controller, Post, Body, Get } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly orchestrator: OrchestratorService) {}

  @Post('launch')
  async launch(@Body() body: { name: string; image: string }) {
    return await this.orchestrator.launchService(body.name, body.image);
  }

  @Get('debug-list-all')
  async debugList() {
    return await this.orchestrator.listRunningServices();
  }

  @Get('test')
  test() {
    return { status: 'Orchestrator Controller is alive', version: '2.0-debug' };
  }
}
