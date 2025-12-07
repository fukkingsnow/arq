import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthResult } from '../services/auth.service';

interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResult> {    return this.authService.register(registerDto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: any): Promise<AuthResult> {    return this.authService.login(req.user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return req.user;
  }
}

/**
 * Authentication Controller
 * 
 * Handles all public authentication endpoints for user registration, login, and profile.
 * Routes requests to AuthService with appropriate guards for security.
 * 
 * Endpoints:
 * 
 * 1. POST /auth/register
 *    - Creates new user account
 *    - No guard (public endpoint)
 *    - Returns: access_token, user, expiresIn
 * 
 * 2. POST /auth/login
 *    - Authenticates with email/password
 *    - LocalAuthGuard validates credentials
 *    - Returns: access_token, user, expiresIn
 * 
 * 3. GET /auth/profile
 *    - Returns current authenticated user
 *    - JwtAuthGuard validates Bearer token
 *    - Returns: user object
 * 
 * Request/Response Examples:
 * 
 * Registration:
 * POST /auth/register
 * Content-Type: application/json
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123",
 *   "firstName": "John",
 *   "lastName": "Doe"
 * }
 * 
 * Response (201 Created):
 * {
 *   "access_token": "eyJhbGciOiJIUzI1NiIs...",
 *   "user": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "isActive": true,
 *     "createdAt": "2025-12-06T22:00:00Z"
 *   },
 *   "expiresIn": 86400
 * }
 * 
 * Login:
 * POST /auth/login
 * Content-Type: application/json
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123"
 * }
 * 
 * Response (200 OK):
 * {
 *   "access_token": "eyJhbGciOiJIUzI1NiIs...",
 *   "user": { ... },
 *   "expiresIn": 86400
 * }
 * 
 * Profile:
 * GET /auth/profile
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Response (200 OK):
 * {
 *   "id": "uuid",
 *   "email": "user@example.com",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "isActive": true,
 *   "createdAt": "2025-12-06T22:00:00Z",
 *   "updatedAt": "2025-12-06T22:00:00Z"
 * }
 * 
 * HTTP Status Codes:
 * - 201: User created successfully (register)
 * - 200: Operation successful (login, profile)
 * - 400: Bad request (missing fields, validation error)
 * - 401: Unauthorized (invalid credentials, expired token)
 * - 409: Conflict (email already registered)
 */

