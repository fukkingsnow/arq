import { Controller, Get } from '@nestjs/common';

@Controller('api/assistant')
export class AssistantController {
  @Get()
  health() {
    return { status: 'ok' };
  }
}
