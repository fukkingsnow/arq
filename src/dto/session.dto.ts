import { IsString, IsUUID, IsOptional, IsBoolean, IsEnum, IsNumber } from 'class-validator';

/**
 * Create browser session request DTO
 */
export class CreateSessionDto {
  /**
   * User ID who owns this session
   */
  @IsUUID()
  userId: string;

  /**
   * Session name for identification
   * @example 'Work Session', 'Testing'
   */
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * Session description
   */
  @IsString()
  @IsOptional()
  description?: string;
}

/**
 * Browser session response DTO
 */
export class SessionDto {
  /**
   * Session unique identifier
   */
  @IsUUID()
  id: string;

  /**
   * User ID who owns this session
   */
  @IsUUID()
  userId: string;

  /**
   * Session name
   */
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * Session description
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Session status
   * @example 'active', 'closed', 'paused'
   */
  @IsEnum(['active', 'closed', 'paused'])
  status: 'active' | 'closed' | 'paused';

  /**
   * Number of tabs in this session
   */
  @IsNumber()
  tabCount: number;

  /**
   * Session creation timestamp
   */
  createdAt: Date;

  /**
   * Session closed timestamp (if applicable)
   */
  @IsOptional()
  closedAt?: Date;
}

/**
 * Update session request DTO
 */
export class UpdateSessionDto {
  /**
   * Update session name
   */
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * Update session description
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Update session status
   */
  @IsEnum(['active', 'closed', 'paused'])
  @IsOptional()
  status?: 'active' | 'closed' | 'paused';
}

/**
 * Session list response DTO
 */
export class SessionListDto {
  /**
   * Array of sessions
   */
  sessions: SessionDto[];

  /**
   * Total number of sessions
   */
  @IsNumber()
  total: number;

  /**
   * Current page
   */
  @IsNumber()
  page: number;

  /**
   * Items per page
   */
  @IsNumber()
  limit: number;
}

/**
 * Close session request DTO
 */
export class CloseSessionDto {
  /**
   * Reason for closing session (optional)
   */
  @IsString()
  @IsOptional()
  reason?: string;
}
