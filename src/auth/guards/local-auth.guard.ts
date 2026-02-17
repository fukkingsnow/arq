import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}

/**
 * Local Authentication Guard
 * 
 * This guard protects the login endpoint with credential-based authentication.
 * Uses Passport.js local strategy for email/password validation.
 * 
 * Simple Implementation:
 * - Extends NestJS AuthGuard with 'local' strategy
 * - Validates email and password from POST request body
 * - Calls LocalStrategy.validate() for credential verification
 * - Injects authenticated user into request.user
 * 
 * Usage in Controllers:
 * @Controller('auth')
 * export class AuthController {
 *   @Post('login')
 *   @UseGuards(LocalAuthGuard)
 *   async login(@Request() req) {
 *     // req.user contains authenticated user from validation
 *     return this.authService.login(req.user);
 *   }
 * }
 * 
 * Request Flow:
 * 1. Client POSTs credentials to /auth/login
 *    Body: { email: "user@example.com", password: "password" }
 * 2. LocalAuthGuard intercepts request
 * 3. Passport LocalStrategy extracts email and password
 * 4. LocalStrategy.validate() is called
 * 5. AuthService.validateUser() verifies credentials
 * 6. User looked up by email in database
 * 7. Password compared with bcrypt hashing
 * 8. User object attached to request if valid
 * 9. Route handler executes with authenticated user
 * 10. AuthService.login() generates JWT token
 * 
 * Expected Request Format:
 * POST /auth/login
 * Content-Type: application/json
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123"
 * }
 * 
 * Successful Response:
 * Status: 200 OK
 * {
 *   "access_token": "eyJhbGciOiJIUzI1NiIs...",
 *   "user": { "id": "...", "email": "user@example.com", ... },
 *   "expiresIn": 86400
 * }
 * 
 * Error Responses:
 * - Missing fields: 400 Bad Request
 * - Invalid credentials: 401 Unauthorized
 * - User not found: 401 Unauthorized
 * - Malformed JSON: 400 Bad Request
 * 
 * Security Features:
 * - Password verified using bcrypt constant-time comparison
 * - Generic error messages (no email enumeration)
 * - Database lookup ensures user exists
 * - Request body validation
 * - Form-based credential submission (not URL parameters)
 * - HTTPS recommended for production
 * 
 * Differences from JwtAuthGuard:
 * - JwtAuthGuard: Validates existing JWT token for protected routes
 * - LocalAuthGuard: Validates initial credentials to generate token
 * 
 * Integration with AuthService:
 * LocalAuthGuard → LocalStrategy → AuthService.validateUser()
 *   → UserRepository.findByEmail() → bcrypt.compare()
 * 
 * Rate Limiting Recommendation:
 * Consider implementing rate limiting at controller level:
 * @UseGuards(RateLimitGuard, LocalAuthGuard)
 * This prevents brute-force password attacks
 * 
 * Failed Login Handling:
 * - Track failed attempts per email
 * - Lock account after N failed attempts
 * - Send notification to account owner
 * - Implement exponential backoff
 */
