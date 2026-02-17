import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extended logging interface for request tracking
 */
interface LogContext {
  requestId: string;
  userId?: string;
  method: string;
  path: string;
  ip: string;
  userAgent?: string;
  statusCode?: number;
  duration: number;
  requestBody?: unknown;
  responseBody?: unknown;
}

/**
 * LoggingInterceptor - HTTP request/response tracking
 *
 * Logs all incoming HTTP requests and outgoing responses with:
 * - Request ID (correlation ID) for tracing
 * - User context (user ID from JWT)
 * - Client IP address
 * - Request/response preview (limited to 500 chars)
 * - Processing duration
 * - Sensitive data filtering (auth, passwords)
 *
 * @injectable
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);
  private readonly sensitivePatterns = [
    'password',
    'token',
    'authorization',
    'secret',
    'apikey',
    'credentials',
  ];

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Extract or generate request ID
    const requestId =
      (request.headers['x-request-id'] as string) || uuidv4();
    response.setHeader('x-request-id', requestId);

    const startTime = Date.now();
    const logContext: LogContext = {
      requestId,
      userId: (request as any)?.user?.id,
      method: request.method,
      path: request.path,
      ip: this.getClientIp(request),
      userAgent: request.get('user-agent'),
      requestBody: this.sanitizeData(request.body),
      duration: 0,
    };

    // Log incoming request
    this.logRequest(logContext);

    return next.handle().pipe(
      tap((responseData) => {
        logContext.duration = Date.now() - startTime;
        logContext.statusCode = response.statusCode;
        logContext.responseBody = this.getPreview(
          this.sanitizeData(responseData),
        );

        this.logResponse(logContext);
      }),
      // Catch errors in response
      (error: any) => {
        logContext.duration = Date.now() - startTime;
        logContext.statusCode = response.statusCode || 500;
        this.logError(logContext, error);
        throw error;
      },
    );
  }

  /**
   * Log incoming request details
   */
  private logRequest(context: LogContext): void {
    const message = `[${context.requestId}] ${context.method} ${context.path}`;
    const meta = {
      userId: context.userId || 'anonymous',
      ip: context.ip,
      userAgent: context.userAgent,
      bodyPreview: this.getPreview(context.requestBody),
    };

    this.logger.debug(message, meta);
  }

  /**
   * Log outgoing response details
   */
  private logResponse(context: LogContext): void {
    const message = `[${context.requestId}] ${context.method} ${context.path} -> ${context.statusCode}`;
    const meta = {
      userId: context.userId || 'anonymous',
      ip: context.ip,
      duration: `${context.duration}ms`,
      responsePreview: context.responseBody,
    };

    const isError = context.statusCode! >= 400;
    isError ? this.logger.warn(message, meta) : this.logger.log(message, meta);
  }

  /**
   * Log request errors
   */
  private logError(
    context: LogContext,
    error: any,
  ): void {
    const message = `[${context.requestId}] ERROR ${context.method} ${context.path} (${context.duration}ms)`;
    const meta = {
      userId: context.userId || 'anonymous',
      ip: context.ip,
      statusCode: context.statusCode,
      errorMessage: error?.message,
      errorStack: error?.stack,
    };

    this.logger.error(message, meta);
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitizeData(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (
        this.sensitivePatterns.some((pattern) =>
          key.toLowerCase().includes(pattern),
        )
      ) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Get preview of data (limit to 500 characters)
   */
  private getPreview(data: unknown, maxLength: number = 500): string {
    if (!data) return '';

    const preview = JSON.stringify(data, null, 2);
    if (preview.length > maxLength) {
      return `${preview.substring(0, maxLength)}... [truncated]`;
    }

    return preview;
  }

  /**
   * Extract client IP from request
   */
  private getClientIp(request: Request): string {
    const forwarded = request.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    return request.ip || request.socket.remoteAddress || 'unknown';
  }
}
