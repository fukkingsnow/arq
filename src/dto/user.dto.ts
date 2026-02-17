import { IsString, IsEmail, IsOptional, IsUUID, IsEnum } from 'class-validator';

/**
 * Get user profile response DTO
 * Contains user account information (without password)
 */
export class GetUserResponseDto {
  /**
   * User unique identifier (UUID)
   * @example 'user-uuid-123'
   */
  @IsString()
  id: string;

  /**
   * User email address
   * @example 'user@example.com'
   */
  @IsEmail()
  email: string;

  /**
   * User full name
   * @example 'John Doe'
   */
  @IsString()
  @IsOptional()
  fullName?: string;

  /**
   * User first name
   * @example 'John'
   */
  @IsString()
  @IsOptional()
  firstName?: string;

  /**
   * User last name
   * @example 'Doe'
   */
  @IsString()
  @IsOptional()
  lastName?: string;

  /**
   * User role in system
   * @example 'user'
   */
  @IsEnum(['admin', 'user', 'moderator'])
  role: 'admin' | 'user' | 'moderator';

  /**
   * Account status
   * @example 'active'
   */
  @IsEnum(['active', 'inactive', 'suspended'])
  status: 'active' | 'inactive' | 'suspended';

  /**
   * Email verification status
   * @default false
   */
  emailVerified: boolean;

  /**
   * Account creation timestamp
   */
  createdAt: Date;

  /**
   * Account last update timestamp
   */
  updatedAt: Date;
}

/**
 * Update user profile request DTO
 * Allows users to update their profile information
 */
export class UpdateUserDto {
  /**
   * User full name (optional)
   * @example 'John Doe'
   */
  @IsString()
  @IsOptional()
  fullName?: string;

  /**
   * User first name (optional)
   * @example 'John'
   */
  @IsString()
  @IsOptional()
  firstName?: string;

  /**
   * User last name (optional)
   * @example 'Doe'
   */
  @IsString()
  @IsOptional()
  lastName?: string;
}

/**
 * Delete user account request DTO
 * Confirmation for account deletion
 */
export class DeleteUserDto {
  /**
   * User password for confirmation
   * Required for security purposes
   */
  @IsString()
  password: string;
}

/**
 * User list response DTO (admin only)
 * Contains paginated user list
 */
export class UserListResponseDto {
  /**
   * Array of users
   */
  users: GetUserResponseDto[];

  /**
   * Total count of users
   */
  total: number;

  /**
   * Current page number
   * @default 1
   */
  page: number;

  /**
   * Items per page
   * @default 10
   */
  limit: number;
}
