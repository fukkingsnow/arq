import { IsString, IsEmail, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';

/**
 * User authentication and login request DTO
 * Handles user credentials for authentication flow
 */
export class LoginDto {
  /**
   * User email address
   * @example 'user@example.com'
   */
  @IsEmail()
  email: string;

  /**
   * User password
   * @minLength 8
   */
  @IsString()
  password: string;

  /**
   * Remember this device for future logins
   * @default false
   */
  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean = false;
}

/**
 * User registration request DTO
 * Handles new user account creation
 */
export class RegisterDto {
  /**
   * User email address (unique)
   * @example 'newuser@example.com'
   */
  @IsEmail()
  email: string;

  /**
   * User password
   * @minLength 8
   * @pattern At least one uppercase, lowercase, number, special char
   */
  @IsString()
  password: string;

  /**
   * Password confirmation
   */
  @IsString()
  passwordConfirm: string;

  /**
   * User full name
   * @example 'John Doe'
   */
  @IsString()
  @IsOptional()
  fullName?: string;
}

/**
 * JWT authentication response DTO
 * Contains session tokens and user information
 */
export class AuthResponseDto {
  /**
   * Access token (Bearer token)
   * @example 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   */
  @IsString()
  accessToken: string;

  /**
   * Refresh token for token renewal
   * @example 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   */
  @IsString()
  refreshToken: string;

  /**
   * Access token expiration time (Unix timestamp)
   * @example 1733571600
   */
  @IsNumber()
  expiresIn: number;

  /**
   * User information object
   */
  @IsOptional()
  user?: {
    id: string;
    email: string;
    fullName?: string;
  };
}

/**
 * Token refresh request DTO
 * Used to obtain new access token using refresh token
 */
export class RefreshTokenDto {
  /**
   * Refresh token from previous authentication
   * @example 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   */
  @IsString()
  refreshToken: string;
}

/**
 * JWT payload DTO
 * Decoded token information for authorization
 */
export class JwtPayloadDto {
  /**
   * User unique identifier
   * @example 'user-uuid-123'
   */
  @IsString()
  sub: string;

  /**
   * User email address
   * @example 'user@example.com'
   */
  @IsEmail()
  email: string;

  /**
   * User roles for RBAC
   * @example ['admin', 'user']
   */
  @IsArray()
  @IsOptional()
  roles?: string[];

  /**
   * Token issue timestamp (Unix)
   * @example 1733571000
   */
  @IsNumber()
  iat: number;

  /**
   * Token expiration timestamp (Unix)
   * @example 1733571600
   */
  @IsNumber()
  exp: number;
}

/**
 * Permission update DTO
 * For RBAC permission management
 */
export class UpdatePermissionsDto {
  /**
   * User ID to update
   */
  @IsString()
  userId: string;

  /**
   * Roles to assign
   * @example ['user', 'moderator']
   */
  @IsArray()
  roles: string[];

  /**
   * Specific permissions to grant
   * @example ['read:browser', 'write:browser']
   */
  @IsArray()
  @IsOptional()
  permissions?: string[];
}
