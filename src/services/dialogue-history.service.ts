import { Injectable } from '@nestjs/common';
import { DialogContext } from '../common/interfaces/dialogue.interface';

export interface DialogueRecord {
  id: string;
  conversationId: string;
  context: DialogContext;
  result: any;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * DialogueHistoryService - Phase 33 Implementation
 * 
 * Tracks dialogue execution history and context.
 * Provides audit trail and analytics for dialogue processing.
 */
@Injectable()
export class DialogueHistoryService {
  private history: Map<string, DialogueRecord[]> = new Map();
  private readonly maxHistoryPerConversation = 500;

  recordDialogue(
    conversationId: string,
    context: DialogContext,
    result: any,
    duration: number,
  ): DialogueRecord {
    const record: DialogueRecord = {
      id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      context,
      result,
      duration,
      timestamp: new Date(),
    };

    if (!this.history.has(conversationId)) {
      this.history.set(conversationId, []);
    }

    const records = this.history.get(conversationId)!;
    if (records.length >= this.maxHistoryPerConversation) {
      records.shift();
    }
    records.push(record);

    return record;
  }

  getHistory(conversationId: string): DialogueRecord[] | null {
    return this.history.get(conversationId) || null;
  }

  getRecord(conversationId: string, recordId: string): DialogueRecord | null {
    const records = this.history.get(conversationId);
    return records?.find(r => r.id === recordId) || null;
  }

  clearHistory(conversationId: string): boolean {
    return this.history.delete(conversationId);
  }

  getAnalytics(conversationId: string) {
    const records = this.history.get(conversationId) || [];
    if (records.length === 0) return null;

    const avgDuration = records.reduce((sum, r) => sum + r.duration, 0) / records.length;
    const successCount = records.filter(r => r.result?.success).length;

    return {
      totalRecords: records.length,
      averageDuration: avgDuration,
      successRate: (successCount / records.length) * 100,
      oldestRecord: records[0].timestamp,
      latestRecord: records[records.length - 1].timestamp,
    };
  }
}
