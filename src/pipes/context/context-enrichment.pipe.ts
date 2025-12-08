import { Injectable } from '@nestjs/common';
import { BasePipe } from '../base/base.pipe';
import { DialogueContext, IPipe, PipeResult } from '../interfaces';

@Injectable()
export class ContextEnrichmentPipe extends BasePipe implements IPipe {
  constructor() {
    super('ContextEnrichmentPipe', {
      description: 'Enriches dialogue context with additional metadata',
      version: '1.0.0',
      priority: 10,
      enabled: true,
    });
  }

  async execute(context: DialogueContext): Promise<PipeResult> {
    try {
      const enrichedContext = { ...context };
      enrichedContext.metadata = enrichedContext.metadata || {};
      enrichedContext.metadata.enrichedAt = new Date().toISOString();
      enrichedContext.metadata.conversationDepth = (context.conversationHistory?.length || 0) + 1;

      if (context.userAgent) {
        enrichedContext.metadata.userAgentAnalyzed = this.parseUserAgent(context.userAgent);
      }

      enrichedContext.metadata.messageSentiment = this.analyzeSentiment(context.message);
      enrichedContext.metadata.detectedLanguage = 'en';
      enrichedContext.metadata.priorityScore = this.calculatePriorityScore(context);

      return this.createSuccessResult(enrichedContext, context);
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : String(error),
        context,
      );
    }
  }

  private parseUserAgent(userAgent: string): Record<string, any> {
    return {
      raw: userAgent,
      browser: 'unknown',
      os: 'unknown',
    };
  }

  private analyzeSentiment(message: string): string {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('happy') || lowerMessage.includes('good')) {
      return 'positive';
    }
    if (lowerMessage.includes('sad') || lowerMessage.includes('bad')) {
      return 'negative';
    }
    return 'neutral';
  }

  private calculatePriorityScore(context: DialogueContext): number {
    const message = context.message.toLowerCase();
    let score = 50;
    if (context.sessionId) {
      score += 10;
    }
    return Math.min(score, 100);
  }
}
