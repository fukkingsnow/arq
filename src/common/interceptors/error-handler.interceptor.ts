import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Error response format
 */
interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
  error: string;
  errorId?: string;
}

/**
 * ErrorHandlerInterceptor - Global error processing and formatting
 *
 * Handles all errors occurring in request processing:
 * - Converts unknown errors to HttpException
 * - Standardizes error response format
 * - Adds error ID for tracking and debugging
 * - Logs detailed error information
 * - Handles validation errors from pipes
 * - Maps database errors to HTTP exceptions
 * - Provides security by hiding internal details
 *
 * @injectable
 */
@Injectable()
export class ErrorHandlerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(
    ErrorHandlerInterceptor.name,
  );

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context
      .switchToHttp()
      .getResponse<Response>();
    const errorId = this.generateErrorId();

    return next.handle().pipe(
      catchError((error) => {
        const statusCode =
          error?.status || error?.statusCode || 500;
        const isHttpException =
          error instanceof HttpException;

        // Log the error
        this.logError(error, request, errorId, statusCode);

        // Transform error to proper HTTP exception
        const httpException = this.transformError(
          error,
          statusCode,
          errorId,
        );

        // Add error ID to response headers
        response.setHeader('x-error-id', errorId);

        return throwError(() => httpException);
      }),
    );
  }

  /**
   * Transform error to HttpException
   */
  private transformError(
    error: any,
    statusCode: number,
    errorId: string,
  ): HttpException {
    // Already an HttpException
    if (error instanceof HttpException) {
      return error;
    }

    // Validation error from class-validator
    if (
      error?.isArray &&
      error?.every((e: any) => e.constraints)
    ) {
      const messages = error.flatMap((e: any) =>
        Object.values(e.constraints || {}),
      );
      return new BadRequestException({
        message: messages,
        error: 'Validation Error',
        errorId,
      });
    }

    // Database duplicate key error
    if (
      error?.code === 'ER_DUP_ENTRY' ||
      error?.code === '23505'
    ) {
      return new ConflictException({
        message: 'Resource already exists',
        error: 'Conflict',
        errorId,
      });
    }

    // Database not found error
    if (
      error?.code === 'ER_NO_REFERENCED_ROW' ||
      error?.code === '23503'
    ) {
      return new BadRequestException({
        message: 'Referenced resource not found',
        error: 'Invalid Reference',
        errorId,
      });
    }

    // Timeout error
    if (error?.code === 'ETIMEDOUT') {
      return new InternalServerErrorException({
        message: 'Request timeout',
        error: 'Gateway Timeout',
        errorId,
      });
    }

    // Default unknown error (500)
    return new InternalServerErrorException({
      message:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : error?.message || 'Unknown error',
      error: 'Internal Server Error',
      errorId,
    });
  }

  /**
   * Log error with full context
   */
  private logError(
    error: any,
    request: any,
    errorId: string,
    statusCode: number,
  ): void {
    const logContext = {
      errorId,
      method: request.method,
      path: request.path,
      statusCode,
      userId: request?.user?.id || 'anonymous',
      ip: request.ip,
      errorMessage: error?.message,
      errorName: error?.name || error?.constructor?.name,
      errorCode: error?.code,
    };

    const logMessage = `[${errorId}] ERROR ${request.method} ${request.path} - ${error?.message}`;

    if (statusCode >= 500) {
      this.logger.error(logMessage, {
        ...logContext,
        stack: error?.stack,
      });
    } else {
      this.logger.warn(logMessage, logContext);
    }
  }

  /**
   * Generate unique error ID for tracking
   */
  private generateErrorId(): string {
    return `ERR-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;
  }
}
