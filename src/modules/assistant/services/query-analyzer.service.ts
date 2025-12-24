import { Injectable } from '@nestjs/common';

export interface QueryAnalysis {
  intent: 'STATUS' | 'ERROR' | 'HELP' | 'ANALYSIS' | 'OPTIMIZATION' | 'UNKNOWN';
  entityId?: string;
  context: Record<string, any>;
  confidence: number;
}

@Injectable()
export class QueryAnalyzerService {
  private readonly intentPatterns = {
    STATUS: /status|state|condition|how.*doing/i,
    ERROR: /error|fail|problem|bug|issue/i,
    HELP: /help|how to|guide|create|setup|configure/i,
    ANALYSIS: /analyze|analyze|progress|metric|performance/i,
    OPTIMIZATION: /optimize|improve|better|faster|reduce/i,
  };

  async analyzeQuery(query: string): Promise<QueryAnalysis> {
    let intent: QueryAnalysis['intent'] = 'UNKNOWN';
    let confidence = 0;
    const context: Record<string, any> = {};

    // Tokenize and analyze
    const tokens = query.toLowerCase().split(/\s+/);
    
    // Detect intent patterns
    for (const [key, pattern] of Object.entries(this.intentPatterns)) {
      if (pattern.test(query)) {
        intent = key as QueryAnalysis['intent'];
        confidence = 0.85;
        break;
      }
    }

    // Extract task ID if present
    const taskIdMatch = query.match(/#?([a-z0-9-]+)/i);
    if (taskIdMatch) {
      context.entityId = taskIdMatch[1];
    }

    // Extract context from tokens
    context.tokens = tokens;
    context.length = query.length;

    return {
      intent,
      entityId: context.entityId,
      context,
      confidence,
    };
  }
}
