import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Response wrapper interface
 */
interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * TransformResponseInterceptor - Standardized API response formatting
 *
 * Wraps all successful HTTP responses in a consistent format:
 * - success flag indicating operation outcome
 * - HTTP status code for client handling
 * - Message describing the operation
 * - Data payload with response body
 * - Timestamp for request tracking
 *
 * Applies to all endpoints for consistency and makes it easier
 * for clients to parse responses.
 *
 * @injectable
 */
@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode || 200;

    return next.handle().pipe(
      map((data) => {
        const message = this.getMessage(
          request.method,
          statusCode,
        );

        return this.formatResponse<typeof data>(
          data,
          statusCode,
          message,
        );
      }),
    );
  }

  /**
   * Format response in standardized structure
   */
  private formatResponse<T = any>(
    data: T,
    statusCode: number,
    message: string,
  ): ApiResponse<T> {
    return {
      success: statusCode < 400,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get appropriate message for HTTP method and status
   */
  private getMessage(
    method: string,
    statusCode: number,
  ): string {
    const messages: Record<string, Record<number, string>> = {
      GET: { 200: 'Data retrieved successfully' },
      POST: { 201: 'Resource created successfully' },
      PUT: { 200: 'Resource updated successfully' },
      PATCH: { 200: 'Resource partially updated' },
      DELETE: { 200: 'Resource deleted successfully', 204: 'Deleted' },
    };

    return (
      messages[method]?.[statusCode] || 'Operation successful'
    );
  }
}
