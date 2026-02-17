import { Injectable, Logger } from '@nestjs/common';
import { TaskEventsGateway } from '../modules/events/task-events.gateway';

export interface TaskError {
  taskId: string;
  type: string;
  message: string;
  code: string;
  timestamp: Date;
  context?: any;
  retriable: boolean;
  retryCount: number;
  maxRetries: number;
}

@Injectable()
export class TaskErrorHandlerService {
  private readonly logger = new Logger(TaskErrorHandlerService.name);
  private errorLog: Map<string, TaskError[]> = new Map();

  constructor(private eventsGateway: TaskEventsGateway) {}

  async handleTaskError(
    taskId: string,
    error: Error | string,
    context?: any,
    retryCount: number = 0,
    maxRetries: number = 3,
  ): Promise<TaskError> {
    const taskError: TaskError = {
      taskId,
      type: error instanceof Error ? error.constructor.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
      code: this.classifyError(error),
      timestamp: new Date(),
      context,
      retriable: this.isRetriable(error, retryCount, maxRetries),
      retryCount,
      maxRetries,
    };

    // Log error
    this.logError(taskError);

    // Store error
    this.storeError(taskError);

    // Broadcast error event
    this.eventsGateway.broadcastTaskError(
      taskId,
      taskError.message,
    );

    return taskError;
  }

  private logError(error: TaskError): void {
    const level = error.retriable ? 'warn' : 'error';
    this.logger[level](
      `Task Error [${error.taskId}]: ${error.type} - ${error.message}`,
      { code: error.code, retryCount: error.retryCount },
    );
  }

  private storeError(error: TaskError): void {
    if (!this.errorLog.has(error.taskId)) {
      this.errorLog.set(error.taskId, []);
    }
    const errors = this.errorLog.get(error.taskId)!;
    errors.push(error);

    // Keep only last 100 errors per task
    if (errors.length > 100) {
      errors.shift();
    }
  }

  private classifyError(error: Error | string): string {
    if (error instanceof TypeError) return 'TYPE_ERROR';
    if (error instanceof ReferenceError) return 'REFERENCE_ERROR';
    if (error instanceof SyntaxError) return 'SYNTAX_ERROR';
    if (error instanceof RangeError) return 'RANGE_ERROR';
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('timeout')) return 'TIMEOUT_ERROR';
      if (message.includes('network')) return 'NETWORK_ERROR';
      if (message.includes('permission')) return 'PERMISSION_ERROR';
      if (message.includes('not found')) return 'NOT_FOUND_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  private isRetriable(
    error: Error | string,
    retryCount: number,
    maxRetries: number,
  ): boolean {
    // Already exceeded max retries
    if (retryCount >= maxRetries) {
      return false;
    }

    const code = this.classifyError(error);
    const retriableCodes = [
      'TIMEOUT_ERROR',
      'NETWORK_ERROR',
      'RANGE_ERROR',
    ];

    return retriableCodes.includes(code);
  }

  getTaskErrors(taskId: string): TaskError[] {
    return this.errorLog.get(taskId) || [];
  }

  clearTaskErrors(taskId: string): void {
    this.errorLog.delete(taskId);
  }

  getErrorStats(): {
    totalTasks: number;
    totalErrors: number;
    averageErrorsPerTask: number;
  } {
    const totalTasks = this.errorLog.size;
    let totalErrors = 0;

    this.errorLog.forEach((errors) => {
      totalErrors += errors.length;
    });

    return {
      totalTasks,
      totalErrors,
      averageErrorsPerTask: totalTasks > 0 ? totalErrors / totalTasks : 0,
    };
  }
}
