import { Injectable } from '@nestjs/common';
import { BasePipe } from '../base/base.pipe';
import { IPipe } from '../interfaces/pipe.interface';
import { DialogContext } from '../../common/interfaces/dialogue.interface';
import { PipeResult } from '../interfaces/pipe.interface';

@Injectable()
export class ContextEnrichmentPipe extends BasePipe implements IPipe {
  constructor() {
    super('ContextEnrichmentPipe', {
      description: 'Enriches dialogue context with additional metadata',
      version: '1.0.0',
      priority: 60,
      enabled: true,
    });
  }

  async execute(context: DialogContext): Promise<PipeResult> {
    try {
      const enrichedContext = { ...context };

      // Enrich with timestamp
      enrichedContext.metadata = enrichedContext.metadata || {};
      enrichedContext.metadata.enrichedAt = new Date().toISOString();

      // Add context depth
      enrichedContext.metadata.conversationDepth = (context.conversationHistory?.length || 0) + 1;

      // Add user agent info if available
      if (context.userAgent) {
        enrichedContext.metadata.userAgentAnalyzed = this.parseUserAgent(context.userAgent);
      }

      // Calculate message sentiment (placeholder)
      enrichedContext.metadata.messageSentiment = this.analyzeSentiment(context.message);

      // Add language detection (placeholder)
      enrichedContext.metadata.detectedLanguage = 'en';

      // Add priority score
      enrichedContext.metadata.priorityScore = this.calculatePriorityScore(context);

      return this.createSuccessResult(enrichedContext, {
        enriched: true,
        fieldsAdded: ['enrichedAt', 'conversationDepth', 'userAgentAnalyzed', 'messageSentiment', 'detectedLanguage', 'priorityScore'],
      });
    } catch (error) {
      return this.createErrorResult(
        new Error(`Enrichment error: ${(error as Error).message}`),
        context,
      );
    }
  }

  private parseUserAgent(userAgent: string): Record<string, any> {
    return {
      raw: userAgent,
      browser: 'Unknown',
      os: 'Unknown',
    };
  }

  private analyzeSentiment(message: string): string {
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'love'];
    const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'hate'];
    
    const lowerMessage = message.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculatePriorityScore(context: DialogContext): number {
    let score = 50; // base score
    
    // Check for urgency keywords
    const urgencyKeywords = ['urgent', 'asap', 'immediate', 'critical'];
    const message = context.message.toLowerCase();
    if (urgencyKeywords.some(keyword => message.includes(keyword))) {
      score += 30;
    }

    // Adjust based on session ID
    if (context.sessionId) {
      score += 10;
    }

    return Math.min(score, 100);
  }
}
