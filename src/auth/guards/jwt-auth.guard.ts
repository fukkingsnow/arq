import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

/**
 * JWT Authentication Guard
 * 
 * This guard protects routes that require valid JWT authentication.
 * Uses Passport.js JWT strategy for token validation and automatic user injection.
 * 
 * Simple Implementation:
 * - Extends NestJS AuthGuard with 'jwt' strategy
 * - Automatically validates Authorization: Bearer <token> header
 * - Validates token signature and expiration
 * - Extracts user from validated payload
 * - Injects user object into request.user
 * 
 * Usage in Controllers:
 * @Controller('api/protected')
 * export class ProtectedController {
 *   @Get('profile')
 *   @UseGuards(JwtAuthGuard)
 *   getProfile(@Request() req) {
 *     // req.user contains authenticated user object
 *     return req.user;
 *   }
 * }
 * 
 * Request Flow:
 * 1. Client sends: GET /api/protected/profile
 *    Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 2. JwtAuthGuard intercepts request
 * 3. Passport JWT strategy extracts Bearer token
 * 4. JwtStrategy validates token signature and expiration
 * 5. JwtStrategy calls validate() for user lookup
 * 6. User object attached to request
 * 7. Route handler executes with authenticated user
 * 
 * Error Responses:
 * - Missing Authorization header: 401 Unauthorized
 * - Invalid Bearer format: 401 Unauthorized
 * - Invalid/expired token: 401 Unauthorized
 * - User not found in database: 401 Unauthorized
 * 
 * Global Usage (app.module.ts):
 * import { APP_GUARD } from '@nestjs/core';
 * 
 * @Module({
 *   providers: [
 *     { provide: APP_GUARD, useClass: JwtAuthGuard },
 *   ],
 * })
 * export class AppModule {}
 * 
 * Method-Level Usage:
 * @Get('public')
 * public() { } // No guard - publicly accessible
 * 
 * @Get('protected')
 * @UseGuards(JwtAuthGuard)
 * protected(@Request() req) { } // Protected by JWT guard
 * 
 * Multiple Guards:
 * @UseGuards(JwtAuthGuard, RoleGuard)
 * adminOnly() { } // Requires both JWT and role validation
 * 
 * Optional Authentication:
 * @Post('optional')
 * @UseGuards(OptionalJwtGuard)
 * optional(@Request() req) {
 *   // req.user is defined if token provided and valid, undefined otherwise
 * }
 * 
 * Security Features:
 * - Validates token signature prevents tampering
 * - Expiration check prevents expired token reuse
 * - Bearer extraction from header only (safe)
 * - User lookup ensures account still exists
 * - Stateless authentication
 * - No sensitive data in token claims
 * 
 * Performance Considerations:
 * - Database lookup on each request (consider caching)
 * - Token validation is fast (cryptographic check)
 * - Consider rate limiting on protected endpoints
 * - Cache user data for frequently accessed endpoints
 */
