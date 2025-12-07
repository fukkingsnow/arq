import { Logger as NestLogger } from '@nestjs/common';

/**
 * Application Logger Utility
 * Provides structured logging with timestamps and log levels.
 * Supports context-based logging for service identification.
 */
export class AppLogger extends NestLogger {
  /**
   * Log informational message
   * @param message - Log message
   * @param context - Context identifier
   */
  logInfo(message: string, context?: string): void {
    this.log(message, context || 'AppLogger');
  }

  /**
   * Log error message
   * @param message - Error message
   * @param error - Error object or stack trace
   * @param context - Context identifier
   */
  logError(message: string, error?: any, context?: string): void {
    this.error(`${message} - ${error?.message || error}`, error?.stack, context || 'AppLogger');
  }

  /**
   * Log warning message
   * @param message - Warning message
   * @param context - Context identifier
   */
  logWarn(message: string, context?: string): void {
    this.warn(message, context || 'AppLogger');
  }

  /**
   * Log debug message
   * @param message - Debug message
   * @param data - Debug data
   * @param context - Context identifier
   */
  logDebug(message: string, data?: any, context?: string): void {
    this.debug(`${message} - ${JSON.stringify(data)}`, context || 'AppLogger');
  }
}

export const logger = new AppLogger();
