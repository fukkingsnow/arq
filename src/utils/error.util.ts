import { BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException, ConflictException, InternalServerErrorException, HttpException } from '@nestjs/common';

/**
 * Application Error Utilities
 * Provides custom error handling and HTTP exception creation.
 * Standardizes error responses across the application.
 */

/**
 * Create Bad Request error
 * @param message - Error message
 * @param details - Additional error details
 */
export function throwBadRequest(message: string, details?: Record<string, any>): void {
  throw new BadRequestException({ message, details });
}

/**
 * Create Unauthorized error
 * @param message - Error message
 */
export function throwUnauthorized(message: string): void {
  throw new UnauthorizedException(message);
}

/**
 * Create Forbidden error
 * @param message - Error message
 */
export function throwForbidden(message: string): void {
  throw new ForbiddenException(message);
}

/**
 * Create Not Found error
 * @param resource - Resource name
 * @param identifier - Resource identifier
 */
export function throwNotFound(resource: string, identifier: string | number): void {
  throw new NotFoundException(`${resource} with ID ${identifier} not found`);
}

/**
 * Create Conflict error
 * @param message - Error message
 */
export function throwConflict(message: string): void {
  throw new ConflictException(message);
}

/**
 * Create Internal Server Error
 * @param message - Error message
 */
export function throwInternalError(message: string): void {
  throw new InternalServerErrorException(message);
}

/**
 * Create custom HTTP exception
 * @param statusCode - HTTP status code
 * @param message - Error message
 */
export function throwHttpException(statusCode: number, message: string): void {
  throw new HttpException(message, statusCode);
}

/**
 * Format error response
 * @param error - Error object
 */
export function formatErrorResponse(error: any): Record<string, any> {
  return {
    status: error.status || 500,
    message: error.message || 'An error occurred',
    details: error.getResponse ? error.getResponse() : null,
    timestamp: new Date().toISOString(),
  };
}
