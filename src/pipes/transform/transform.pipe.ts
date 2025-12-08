import { Injectable } from '@nestjs/common';
import { BasePipe } from '../../base.pipe';
import { IPipe } from '../../interfaces/pipe.interface';
import { DialogueContext } from '../../../common/interfaces/dialogue.interface';
import { PipeResult } from '../../interfaces/pipe.interface';

export interface TransformConfig {
  transformations: Map<string, (value: any) => any>;
}

@Injectable()
fix(transform.pipe): 3 errors - transformer null check, parameter order, Error to string
export class TransformPipe extends BasePipe implements IPipe {
  private readonly transformationMap: Map<string, (value: any) => any> = new Map();

  constructor() {
    super('TransformPipe', {
      description: 'Transforms dialogue context data',
      version: '1.0.0',
      priority: 70,
      enabled: true,
    });
    this.initializeTransformations();
  }

  private initializeTransformations(): void {
    this.transformationMap.set('toLowerCase', (val: any) => typeof val === 'string' ? val.toLowerCase() : val);
    this.transformationMap.set('toUpperCase', (val: any) => typeof val === 'string' ? val.toUpperCase() : val);
    this.transformationMap.set('trim', (val: any) => typeof val === 'string' ? val.trim() : val);
    this.transformationMap.set('parseInt', (val: any) => parseInt(val));
    this.transformationMap.set('parseFloat', (val: any) => parseFloat(val));
    this.transformationMap.set('toString', (val: any) => String(val));
    this.transformationMap.set('jsonStringify', (val: any) => JSON.stringify(val));
    this.transformationMap.set('jsonParse', (val: any) => {
      try {
        return typeof val === 'string' ? JSON.parse(val) : val;
      } catch {
        return val;
      }
    });
  }

  async execute(context: DialogueContext): Promise<PipeResult> {
    try {
      const transformedContext = { ...context };

      if (context.metadata?.transformations) {
        for (const [key, transformName] of Object.entries(context.metadata.transformations)) {
          if (transformName && this.transformationMap.has(transformName as string)) {
            const transformer = this.transformationMap.get(transformName as string);
            if (transformer) {
              transformedContext[key] = transformer(context[key]);
            }
          }
        }
      }

      return this.createSuccessResult(
        {
          ...transformedContext,
          transformationCount: Object.keys(context.metadata?.transformations || {}).length,
        },
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
