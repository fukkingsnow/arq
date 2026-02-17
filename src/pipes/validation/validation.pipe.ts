import { BasePipe } from '../base/base.pipe';
import { DialogueContext, PipeResult } from '../interfaces';

/**
 * ValidationPipe - Validates dialogue context and message integrity
 * Checks: non-empty message, valid userId, sessionId, presence of required fields
 */
export class ValidationPipe extends BasePipe {
  constructor() {
    super('ValidationPipe', {
      description: 'Validates dialogue context and message format',
      version: '1.0.0',
      priority: 100,
      enabled: true,
    });
  }

  async execute(context: DialogueContext): Promise<PipeResult> {
    try {
      // Validate required fields
      if (!context.message || context.message.trim().length === 0) {
        return this.createErrorResult('Message cannot be empty', context);
      }

      if (!context.userId || context.userId.trim().length === 0) {
        return this.createErrorResult('Invalid userId', context);
      }

      if (!context.sessionId || context.sessionId.trim().length === 0) {
        return this.createErrorResult('Invalid sessionId', context);
      }

      // Validate message length
      if (context.message.length > 10000) {
        return this.createErrorResult('Message exceeds maximum length (10000 chars)', context);
      }

      return this.createSuccessResult(
        { validated: true, messageLength: context.message.length },
        context,
      );
    } catch (error) {
      return this.createErrorResult(
        `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context,
      );
    }
  }
}
