/**
 * Error Response DTO
 * Standardized error response format for all API errors
 */
export class ErrorResponseDto {
  /**
   * HTTP status code
   * @type {number}
   */
  statusCode: number;

  /**
   * ISO timestamp when the error occurred
   * @type {string}
   */
  timestamp: string;

  /**
   * Request path that caused the error
   * @type {string}
   */
  path: string;

  /**
   * HTTP method of the request
   * @type {string}
   */
  method: string;

  /**
   * General error message
   * @type {string}
   */
  message: string;

  /**
   * Field-level error details
   * Maps field names to arrays of error messages
   * @type {Record<string, string[]>}
   */
  errors?: Record<string, string[]>;
}

/**
 * Error Metadata DTO
 * Additional metadata about error context
 */
export class ErrorMetadataDto {
  /**
   * Unique error identifier
   * @type {string}
   */
  errorId: string;

  /**
   * Error category (validation, authorization, etc.)
   * @type {string}
   */
  category: string;

  /**
   * Error severity level
   * @type {'low' | 'medium' | 'high' | 'critical'}
   */
  severity: 'low' | 'medium' | 'high' | 'critical';

  /**
   * Whether the error is retryable
   * @type {boolean}
   */
  retryable: boolean;

  /**
   * Stack trace for debugging (only in development)
   * @type {string}
   */
  stack?: string;
}

/**
 * Validation Error Detail DTO
 * Detailed information about validation errors
 */
export class ValidationErrorDetailDto {
  /**
   * Field name that failed validation
   * @type {string}
   */
  field: string;

  /**
   * Validation constraint that failed
   * @type {string}
   */
  constraint: string;

  /**
   * Actual value that failed validation
   * @type {any}
   */
  value?: any;

  /**
   * Detailed error message
   * @type {string}
   */
  message: string;
}
