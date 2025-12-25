import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface TraceSpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  tags: Record<string, any>;
  logs: Array<{ timestamp: number; message: string }>;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

@Injectable()
export class DistributedTracingService {
  private readonly logger = new Logger(DistributedTracingService.name);
  private traces: Map<string, TraceSpan[]> = new Map();
  private activeSpans: Map<string, TraceSpan> = new Map();

  /**
   * Start a new trace span
   */
  startSpan(
    operationName: string,
    parentContext?: TraceContext,
    tags: Record<string, any> = {}
  ): TraceContext {
    const traceId = parentContext?.traceId || uuidv4();
    const spanId = uuidv4();
    const parentSpanId = parentContext?.spanId;

    const span: TraceSpan = {
      spanId,
      traceId,
      parentSpanId,
      operationName,
      startTime: Date.now(),
      status: 'ACTIVE',
      tags: {
        ...tags,
        startTime: new Date().toISOString(),
      },
      logs: [],
    };

    this.activeSpans.set(spanId, span);

    // Store span in trace
    if (!this.traces.has(traceId)) {
      this.traces.set(traceId, []);
    }
    this.traces.get(traceId)!.push(span);

    this.logger.debug(
      `Started span ${spanId} for trace ${traceId} operation: ${operationName}`
    );

    return { traceId, spanId, parentSpanId };
  }

  /**
   * Add log entry to active span
   */
  logEvent(
    spanId: string,
    message: string,
    metadata: Record<string, any> = {}
  ): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      this.logger.warn(`Span ${spanId} not found`);
      return;
    }

    span.logs.push({
      timestamp: Date.now(),
      message: `${message} | ${JSON.stringify(metadata)}`,
    });
  }

  /**
   * Add tags to active span
   */
  addTags(spanId: string, tags: Record<string, any>): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      this.logger.warn(`Span ${spanId} not found`);
      return;
    }

    span.tags = { ...span.tags, ...tags };
  }

  /**
   * Complete a span successfully
   */
  completeSpan(spanId: string, resultTags: Record<string, any> = {}): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      this.logger.warn(`Span ${spanId} not found`);
      return;
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = 'COMPLETED';
    span.tags = { ...span.tags, ...resultTags, endTime: new Date().toISOString() };

    this.logger.debug(
      `Completed span ${spanId} in ${span.duration}ms (${span.operationName})`
    );
  }

  /**
   * Fail a span with error information
   */
  failSpan(spanId: string, error: Error | string): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      this.logger.warn(`Span ${spanId} not found`);
      return;
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = 'FAILED';
    span.tags = {
      ...span.tags,
      error: typeof error === 'string' ? error : error.message,
      endTime: new Date().toISOString(),
    };

    this.logger.error(`Failed span ${spanId}: ${error}`);
  }

  /**
   * Get complete trace
   */
  getTrace(traceId: string): TraceSpan[] | undefined {
    return this.traces.get(traceId);
  }

  /**
   * Export trace in Jaeger compatible format
   */
  exportTrace(traceId: string): any {
    const spans = this.traces.get(traceId) || [];

    return {
      traceID: traceId,
      spans: spans.map(span => ({
        traceID: span.traceId,
        spanID: span.spanId,
        parentSpanID: span.parentSpanId,
        operationName: span.operationName,
        startTime: span.startTime,
        duration: span.duration || 0,
        tags: Object.entries(span.tags).map(([key, value]) => ({
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
        })),
        logs: span.logs.map(log => ({
          timestamp: log.timestamp,
          fields: [{ key: 'message', value: log.message }],
        })),
      })),
    };
  }

  /**
   * Get trace statistics
   */
  getTraceStats(traceId: string): any {
    const spans = this.traces.get(traceId) || [];
    const completedSpans = spans.filter(s => s.status === 'COMPLETED');
    const failedSpans = spans.filter(s => s.status === 'FAILED');
    const totalDuration = spans.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgDuration = completedSpans.length > 0 ? totalDuration / completedSpans.length : 0;

    return {
      traceId,
      totalSpans: spans.length,
      completedSpans: completedSpans.length,
      failedSpans: failedSpans.length,
      totalDuration,
      avgDuration,
      successRate: `${((completedSpans.length / spans.length) * 100).toFixed(2)}%`,
    };
  }

  /**
   * Cleanup completed traces
   */
  cleanup(maxAge: number = 3600000): void {
    // max age in milliseconds (default 1 hour)
    const now = Date.now();
    let removed = 0;

    for (const [traceId, spans] of this.traces.entries()) {
      const oldestSpan = spans[0];
      if (now - oldestSpan.startTime > maxAge) {
        this.traces.delete(traceId);
        spans.forEach(span => this.activeSpans.delete(span.spanId));
        removed++;
      }
    }

    if (removed > 0) {
      this.logger.log(`Cleaned up ${removed} old traces`);
    }
  }
}
