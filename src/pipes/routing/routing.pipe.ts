import { Injectable } from '@nestjs/common';
import { BasePipe } from '../base/base.pipe';
import { DialogueContext, IPipe, PipeResult } from '../interfaces';

@Injectable()
export class RoutingPipe extends BasePipe implements IPipe {
  constructor() {
    super('RoutingPipe', {
      description: 'Routing pipe for determining request path',
      version: '1.0.0',
      priority: 60,
      enabled: true,
    });
  }

  async execute(context: DialogueContext): Promise<PipeResult> {
    try {
      return this.createSuccessResult(
        { ...context, routed: true },
        context,
      );
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : String(error),
        context,
      );
    }
  }
}
