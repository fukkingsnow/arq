import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';

/**
 * Validation Exception Filter
 *
 * Catches BadRequestException errors and transforms validation error
 * responses into a standardized format with detailed field-level messages.
 */
@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  /**
   * Catch handler for validation exceptions
   */
  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: 'Validation failed',
      errors: this.extractValidationErrors(exceptionResponse),
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Extract validation errors from exception response
   * Handles both class-validator format and generic error objects
   */
  private extractValidationErrors(
    exceptionResponse: any,
  ): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    if (Array.isArray(exceptionResponse?.message)) {
      exceptionResponse.message.forEach((error: ValidationError | string) => {
        if (typeof error === 'object' && error.property) {
          const messages = this.getConstraintMessages(error);
          errors[error.property] = messages;
        } else if (typeof error === 'string') {
          errors.general = errors.general || [];
          errors.general.push(error);
        }
      });
    } else if (typeof exceptionResponse?.message === 'string') {
      errors.general = [exceptionResponse.message];
    }

    return errors;
  }

  /**
   * Extract constraint messages from validation error
   */
  private getConstraintMessages(error: ValidationError): string[] {
    const messages: string[] = [];

    if (error.constraints) {
      Object.values(error.constraints).forEach((constraint) => {
        messages.push(constraint);
      });
    }

    if (error.children && error.children.length > 0) {
      error.children.forEach((child) => {
        const childMessages = this.getConstraintMessages(child);
        messages.push(...childMessages);
      });
    }

    return messages;
  }
}
