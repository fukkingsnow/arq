import { Injectable } from '@nestjs/common';
import { BasePipe } from '../base/base.pipe';
import { IPipe } from '../interfaces/pipe.interface';
import { ValidationPipe } from '../validation/validation.pipe';
import { TransformPipe } from '../transform/transform.pipe';
import { ContextEnrichmentPipe } from '../context/context-enrichment.pipe';
import { RoutingPipe } from '../routing/routing.pipe';
import { IntentParsingPipe } from '../intent/intent-parsing.pipe';
import { DialogContext } from '../../common/interfaces/dialogue.interface';
import { PipeResult } from '../interfaces/pipe.interface';

export interface PipelineConfig {
  pipes: IPipe[];
  stopOnError: boolean;
  logExecution: boolean;
}

@Injectable()
export class PipePipelineFactory {
  private pipelines: Map<string, IPipe[]> = new Map();
  private defaultPipeline: IPipe[] = [];

  constructor(
    private validationPipe: ValidationPipe,
    private transformPipe: TransformPipe,
    private enrichmentPipe: ContextEnrichmentPipe,
    private routingPipe: RoutingPipe,
    private intentParsingPipe: IntentParsingPipe,
  ) {
    this.initializeDefaultPipeline();
  }

  private initializeDefaultPipeline(): void {
    // Default pipeline order: validate -> enrich -> parse intent -> transform -> route
    this.defaultPipeline = [
      this.validationPipe,
      this.enrichmentPipe,
      this.intentParsingPipe,
      this.transformPipe,
      this.routingPipe,
    ];
  }

  registerPipeline(name: string, pipes: IPipe[]): void {
    this.pipelines.set(name, pipes);
  }

  getPipeline(name?: string): IPipe[] {
    if (!name) {
      return this.defaultPipeline;
    }
    return this.pipelines.get(name) || this.defaultPipeline;
  }

  async executePipeline(
    context: DialogContext,
    pipelineName?: string,
    config?: Partial<PipelineConfig>,
  ): Promise<PipeResult> {
    const pipeline = this.getPipeline(pipelineName);
    const stopOnError = config?.stopOnError ?? true;
    const logExecution = config?.logExecution ?? false;
    let currentContext = { ...context };
    const results: PipeResult[] = [];

    for (const pipe of pipeline) {
      if (logExecution) {
        console.log(`Executing pipe: ${pipe.metadata?.name || 'Unknown'}`);
      }

      const result = await pipe.execute({ ...currentContext, message: context.message, userId: context.userId, sessionId: context.sessionId });
      results.push(result);

      if (!result.success && stopOnError) {
        return result;
      }

      if (result.success && result.data) {
        currentContext = result.data;
      }
    }

    return {
      success: true,
      data: currentContext,
      metadata: {
        pipelineExecuted: pipelineName || 'default',
        executedPipes: results.map(r => r.metadata),
        errorHandled: false,
      },
    };
  }

  async executeSpecificPipes(
    context: DialogContext,
    pipeNames: string[],
  ): Promise<PipeResult> {
    const allPipes = [
      this.validationPipe,
      this.transformPipe,
      this.enrichmentPipe,
      this.routingPipe,
      this.intentParsingPipe,
    ];

    const selectedPipes = allPipes.filter(pipe =>
      pipeNames.includes(pipe.metadata?.name || ''),
    );

    if (selectedPipes.length === 0) {
      return {
        success: false,
        error: 'No valid pipes found for execution',
        data: context,
      };
    }

    return this.executePipeline(context, undefined, {
      stopOnError: false,
    });
  }

  createCustomPipeline(pipes: IPipe[]): IPipe[] {
    return pipes.sort((a, b) => ((b.metadata?.priority) || 0) - ((a.metadata?.priority) || 0));
  }
}
