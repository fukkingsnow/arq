import { IsNumber, IsOptional, IsString, IsEnum, Min, Max } from 'class-validator';

/**
 * Pagination query parameters DTO
 * Common pagination input for list endpoints
 */
export class PaginationQueryDto {
  /**
   * Current page number (1-indexed)
   * @default 1
   * @minimum 1
   */
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  /**
   * Items per page limit
   * @default 10
   * @minimum 1
   * @maximum 100
   */
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  /**
   * Sort field name
   * @example 'createdAt' or 'name'
   */
  @IsString()
  @IsOptional()
  sortBy?: string;

  /**
   * Sort direction
   * @enum 'asc' | 'desc'
   * @default 'desc'
   */
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortDirection?: 'asc' | 'desc' = 'desc';

  /**
   * Search query string
   * @example 'browser'
   */
  @IsString()
  @IsOptional()
  search?: string;

  /**
   * Filter by status
   * @example 'active'
   */
  @IsString()
  @IsOptional()
  status?: string;
}

/**
 * Pagination metadata DTO
 * Provides navigation information for paginated results
 */
export class PaginationMetaDto {
  /**
   * Total items count across all pages
   * @example 150
   */
  @IsNumber()
  total: number;

  /**
   * Current page number (1-indexed)
   * @example 2
   */
  @IsNumber()
  currentPage: number;

  /**
   * Items per page limit
   * @example 10
   */
  @IsNumber()
  pageSize: number;

  /**
   * Total number of pages
   * @example 15
   */
  @IsNumber()
  totalPages: number;

  /**
   * Next page number (null if no next page)
   * @example 3
   */
  @IsNumber()
  @IsOptional()
  nextPage?: number | null;

  /**
   * Previous page number (null if no previous page)
   * @example 1
   */
  @IsNumber()
  @IsOptional()
  prevPage?: number | null;

  /**
   * Whether first page
   * @example false
   */
  @IsOptional()
  isFirstPage?: boolean;

  /**
   * Whether last page
   * @example false
   */
  @IsOptional()
  isLastPage?: boolean;

  /**
   * Skip (offset) for database queries
   * @example 10
   */
  @IsNumber()
  @IsOptional()
  skip?: number;
}

/**
 * Cursor-based pagination query DTO
 * For efficient pagination in large datasets
 */
export class CursorPaginationDto {
  /**
   * Cursor position (base64 encoded)
   * @optional
   */
  @IsString()
  @IsOptional()
  cursor?: string;

  /**
   * Items per page limit
   * @default 10
   * @maximum 100
   */
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  /**
   * Direction for cursor pagination
   * @enum 'next' | 'prev'
   * @default 'next'
   */
  @IsEnum(['next', 'prev'])
  @IsOptional()
  direction?: 'next' | 'prev' = 'next';
}
