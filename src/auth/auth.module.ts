import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { AuthController } from './controllers/auth.controller';
import { User } from '../entities/user.entity';
import { UserRepository } from '../users/repositories/user.repository';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'dev-secret-key-change-in-production',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION') || '24h' as any,
        },
      }),
    }),
    TypeOrmModule.forFeature([User, UserRepository]),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    JwtAuthGuard,
    LocalAuthGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, LocalAuthGuard],
})
export class AuthModule {}

/**
 * Authentication Module Architecture
 * 
 * This module provides comprehensive JWT and Local authentication strategies
 * integrated with NestJS Passport library for secure credential validation.
 * 
 * Structure:
 * - AuthService: Core authentication business logic
 *   - User validation against database
 *   - JWT token generation and validation
 *   - Password hashing/verification using bcrypt
 *   - Login/registration workflows
 * 
 * - JwtStrategy: Passport JWT strategy implementation
 *   - Validates JWT tokens from Authorization headers
 *   - Extracts and validates user payload
 *   - Integrates with @UseGuards(JwtAuthGuard) decorator
 * 
 * - LocalStrategy: Passport local strategy for credentials
 *   - Validates username and password on login
 *   - Supports email-based authentication
 *   - Returns authenticated user object
 * 
 * - JwtAuthGuard: Route protection decorator
 *   - Guards protected endpoints requiring JWT token
 *   - Automatically validates Authorization: Bearer <token>
 * 
 * - LocalAuthGuard: Login endpoint protection
 *   - Validates credentials before token generation
 *   - Prevents unauthorized access to auth endpoints
 * 
 * - AuthController: HTTP endpoint handlers
 *   - POST /auth/register: User registration with validation
 *   - POST /auth/login: Credential-based login
 *   - POST /auth/refresh: Token refresh mechanism
 *   - GET /auth/profile: Protected user profile retrieval
 * 
 * Security Features:
 * - JWT tokens with 24-hour expiration (configurable)
 * - Bcrypt password hashing with 10 salt rounds
 * - Token validation on every protected request
 * - User payload extraction from JWT
 * - Configuration-based secret management
 * - Automatic token refresh capability
 * 
 * Environment Configuration:
 * - JWT_SECRET: Secret key for signing tokens (prod only)
 * - JWT_EXPIRATION: Token expiration time (default: 24h)
 * - DATABASE_URL: PostgreSQL connection string
 * 
 * Usage Example:
 * 
 * @Controller('auth')
 * export class AuthController {
 *   @Post('login')
 *   @UseGuards(LocalAuthGuard)
 *   async login(@Request() req) {
 *     return this.authService.login(req.user);
 *   }
 * 
 *   @Get('profile')
 *   @UseGuards(JwtAuthGuard)
 *   getProfile(@Request() req) {
 *     return req.user;
 *   }
 * }
 * 
 * Testing Authentication:
 * 1. Register new user: POST /auth/register with email and password
 * 2. Obtain token: POST /auth/login with credentials
 * 3. Access protected: GET /auth/profile with Authorization header
 * 
 * Dependencies:
 * - @nestjs/passport: Authentication middleware
 * - @nestjs/jwt: JWT token generation and validation
 * - passport-jwt: JWT strategy implementation
 * - passport-local: Local credential validation
 * - bcrypt: Password hashing and verification
 * - @nestjs/config: Environment configuration
 */

