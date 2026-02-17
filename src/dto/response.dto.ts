import { IsNumber, IsString, IsBoolean, IsObject, IsOptional, IsArray } from 'class-validator';

/**
 * Generic API response wrapper DTO
 * Standardized response format for all API endpoints
 */
export class ApiResponseDto<T> {
  /**
   * Operation success indicator
   * @example true
   */
  @IsBoolean()
  success: boolean;

  /**
   * HTTP status code
   * @example 200
   */
  @IsNumber()
  statusCode: number;

  /**
   * Response message
   * @example 'Browser automation completed successfully'
   */
  @IsString()
  message: string;

  /**
   * Response data payload
   * @generic T - Type of response data
   */
  @IsOptional()
  data?: T;

  /**
   * Response timestamp (Unix milliseconds)
   * @example 1733571600000
   */
  @IsNumber()
  timestamp: number;

  /**
   * Request ID for tracing
   * @example 'req-uuid-123'
   */
  @IsString()
  @IsOptional()
  requestId?: string;
}

/**
 * Paginated response DTO
 * For list endpoints with pagination support
 */
export class PaginatedResponseDto<T> {
  /**
   * Array of data items
   */
  @IsArray()
  items: T[];

  /**
   * Total number of items across all pages
   * @example 150
   */
  @IsNumber()
  total: number;

  /**
   * Current page number (1-indexed)
   * @example 1
   */
  @IsNumber()
  page: number;

  /**
   * Items per page limit
   * @example 10
   */
  @IsNumber()
  limit: number;

  /**
   * Total number of pages
   * @example 15
   */
  @IsNumber()
  pages: number;

  /**
   * Whether more pages are available
   * @example true
   */
  @IsBoolean()
  hasNextPage: boolean;

  /**
   * Whether this is the first page
   * @example true
   */
  @IsBoolean()
  isFirstPage: boolean;
}

/**
 * Error response DTO
 * Standardized error format
 */
export class ErrorResponseDto {
  /**
   * Error code identifier
   * @example 'VALIDATION_ERROR'
   */
  @IsString()
  code: string;

  /**
   * Human-readable error message
   * @example 'Invalid browser configuration'
   */
  @IsString()
  message: string;

  /**
   * Detailed error information
   * @optional
   */
  @IsOptional()
  details?: any;

  /**
   * Error stack trace (development only)
   * @optional
   */
  @IsString()
  @IsOptional()
  stack?: string;
}

/**
 * File upload response DTO
 * Response format for file uploads
 */
export class FileUploadResponseDto {
  /**
   * Uploaded file ID
   * @example 'file-uuid-123'
   */
  @IsString()
  fileId: string;

  /**
   * Original file name
   * @example 'screenshot.png'
   */
  @IsString()
  fileName: string;

  /**
   * MIME type of uploaded file
   * @example 'image/png'
   */
  @IsString()
  mimeType: string;

  /**
   * File size in bytes
   * @example 102400
   */
  @IsNumber()
  size: number;

  /**
   * Download URL for the file
   * @example '/api/files/file-uuid-123/download'
   */
  @IsString()
  downloadUrl: string;

  /**
   * File upload timestamp
   * @example 1733571600000
   */
  @IsNumber()
  uploadedAt: number;
}
