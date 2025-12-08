import { Injectable } from '@nestjs/common';
import { BasePipe } from '../base/base.pipe';
import { IPipe, PipeResult } from '../interfaces';
import { DialogueContext } from '../../common/interfaces/dialogue.interface';

@Injectable()
export class TransformPipe extends BasePipe implements IPipe {
  async execute(context: DialogueContext): Promise<PipeResult> {
    try {
      return this.createSuccessResult({ ...context, transformed: true }, context);
    } catch (error) {
      return this.createErrorResult(error instanceof Error ? error.message : String(error), context);
    }
  }
}
