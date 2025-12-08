import { Injectable } from '@nestjs/common';
import { PipePipelineFactory } from '../pipes/pipeline/pipe-pipeline.factory';
import { DialogContext } from '../common/interfaces/dialogue.interface';
import { PipeResult } from '../pipes/interfaces/pipe.interface';
import { SessionService } from './session.service';
import { UserService } from './user.service';

/**
 * DialogueService - Phase 33 Implementation
 * 
 * Orchestrates dialogue processing pipeline and manages dialogue state.
 * Integrates with PipesModule to process dialogue contexts.
 */
@Injectable()
export class DialogueService {
  constructor(
    private pipelineFactory: PipePipelineFactory,
    private sessionService: SessionService,
    private userService: UserService,
  ) {}

  /**
   * Process a dialogue message through the configured pipeline
   */
  async processDialogue(context: DialogContext): Promise<PipeResult> {
    // Enrich context with session and user data
    const enrichedContext = await this.enrichContext(context);

    // Execute the dialogue pipeline
    return this.pipelineFactory.executePipeline(
      enrichedContext,
      undefined,
      {
        stopOnError: false,
        logExecution: true,
      },
    );
  }

  /**
   * Process dialogue with a specific pipeline
   */
  async processWithPipeline(
    context: DialogContext,
    pipelineName: string,
  ): Promise<PipeResult> {
    const enrichedContext = await this.enrichContext(context);

    return this.pipelineFactory.executePipeline(
      enrichedContext,
      pipelineName,
      {
        logExecution: true,
      },
    );
  }

  /**
   * Enrich dialogue context with session and user data
   */
  private async enrichContext(
    context: DialogContext,
  ): Promise<DialogContext> {
    const enriched = { ...context };

    // Add session data if available
    if (context.sessionId) {
      try {
        const session = await (this.sessionService as any).findById?.(context.sessionId);
        if (session) {
          enriched.metadata = enriched.metadata || {};
          enriched.metadata['sessionData'] = session;
        }
      } catch (e) {
        // Session not found, continue
      }
    }

    // Add user data if available
    if (context.userId) {
      try {
        const user = await (this.userService as any).findById?.(context.userId);
        if (user) {
          enriched.metadata = enriched.metadata || {};
          enriched.metadata['userData'] = user;
        }
      } catch (e) {
        // User not found, continue
      }
    }

    return enriched;
  }
}
