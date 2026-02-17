import { Injectable } from '@nestjs/common';
import { BasePipe } from '../base/base.pipe';
import { DialogueContext, IPipe, PipeResult } from '../interfaces';

@Injectable()
export class TransformPipe extends BasePipe implements IPipe {
  constructor() {
    super('TransformPipe', {
      description: 'Transform pipe for processing data',
      version: '1.0.0',
      priority: 50,
      enabled: true,
    });
  }

  async execute(context: DialogueContext): Promise<PipeResult> {
    try {
      return this.createSuccessResult(
        { ...context, transformed: true },
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
