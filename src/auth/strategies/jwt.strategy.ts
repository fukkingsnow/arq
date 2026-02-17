import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { User } from '../../entities/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev-secret-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload): Promise<User | null> {
    return this.authService.validateJwtPayload(payload);
  }
}

/**
 * JWT Passport Strategy Implementation
 * 
 * This strategy validates JWT tokens from Authorization headers in HTTP requests.
 * Integrates with Passport.js framework for seamless authentication.
 * 
 * Configuration:
 * - jwtFromRequest: Extracts token from Authorization: Bearer <token> header
 * - ignoreExpiration: false - Validates token expiration (rejects expired tokens)
 * - secretOrKey: Uses JWT_SECRET environment variable for validation
 * 
 * Token Extraction:
 * - Looks for token in Authorization header with Bearer schema
 * - Format: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * - Automatic extraction handled by ExtractJwt.fromAuthHeaderAsBearerToken()
 * 
 * Validation Flow:
 * 1. Passport extracts Bearer token from request header
 * 2. Passport verifies signature using JWT_SECRET
 * 3. Passport checks token expiration
 * 4. Calls validate() method with decoded payload
 * 5. validate() queries database to fetch full user object
 * 6. Returns user object or null if user not found
 * 
 * Payload Structure:
 * - sub: User ID (stored in 'subject' claim)
 * - email: User email address
 * - iat: Issued at timestamp
 * - exp: Expiration timestamp (24 hours from issue)
 * 
 * Usage in Controllers:
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@Request() req) {
 *   return req.user; // User object from validate()
 * }
 * 
 * Error Handling:
 * - Invalid signature: Passport throws UnauthorizedException
 * - Expired token: Passport throws UnauthorizedException
 * - Missing token: Passport throws UnauthorizedException
 * - User not found: validate() returns null, triggers 401
 * 
 * Security Features:
 * - Token signature validation prevents tampering
 * - Expiration check prevents token reuse after timeout
 * - Database lookup ensures user still exists and is active
 * - Bearer token extraction from header only (safe)
 * - Stateless authentication (no session required)
 * 
 * Integration Points:
 * - AuthService.validateJwtPayload(): Database user lookup
 * - ConfigService: Environment-based secret management
 * - PassportStrategy base: Passport.js integration
 * - JwtAuthGuard: Route protection decorator
 * 
 * Environment Variables:
 * - JWT_SECRET: Secret key for signing/verifying tokens
 * - Should be strong and random in production
 * - Different from development key for security
 */
