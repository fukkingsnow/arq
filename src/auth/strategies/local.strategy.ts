import { Injectable, BadRequestException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../services/auth.service';
import { User } from '../../entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<User> {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }

    return user;
  }
}

/**
 * Local Passport Strategy Implementation
 * 
 * This strategy validates user credentials (email and password) for form-based login.
 * Used exclusively for POST /auth/login endpoint with username/password form submission.
 * 
 * Configuration:
 * - usernameField: 'email' - Expects email field instead of standard 'username'
 * - passwordField: 'password' - Standard password field
 * 
 * Credential Extraction:
 * - Extracts credentials from POST request body
 * - Expected format: { email: "user@example.com", password: "password" }
 * - Supports application/x-www-form-urlencoded and application/json
 * 
 * Validation Flow:
 * 1. Client POSTs credentials to /auth/login
 * 2. LocalAuthGuard triggers this strategy
 * 3. Passport extracts email and password from request body
 * 4. Calls validate() method with credentials
 * 5. validate() calls AuthService.validateUser()
 * 6. AuthService looks up user by email and verifies password
 * 7. Returns user object if valid, null if invalid
 * 8. Strategy throws BadRequestException if validation fails
 * 
 * Usage in Controllers:
 * @Post('login')
 * @UseGuards(LocalAuthGuard)
 * async login(@Request() req) {
 *   // req.user contains authenticated user
 *   return this.authService.login(req.user);
 * }
 * 
 * Error Handling:
 * - Missing email or password: BadRequestException
 * - User not found: BadRequestException (generic)
 * - Invalid password: BadRequestException (generic)
 * - Generic error messages prevent email enumeration attacks
 * 
 * Security Features:
 * - Generic error messages ("Invalid email or password")
 * - Prevents username enumeration attacks
 * - Bcrypt password comparison prevents timing attacks
 * - Database lookup ensures user exists
 * - No sensitive data in error responses
 * - Rate limiting recommended at controller level
 * 
 * Integration Points:
 * - AuthService.validateUser(): Database credential verification
 * - LocalAuthGuard: Route protection decorator
 * - POST /auth/login endpoint
 * 
 * Flow Diagram:
 * Client Request
 *   ↓
 * @UseGuards(LocalAuthGuard)
 *   ↓
 * LocalStrategy.validate(email, password)
 *   ↓
 * AuthService.validateUser(email, password)
 *   ↓
 * UserRepository.findByEmail(email)
 *   ↓
 * bcrypt.compare(password, hashedPassword)
 *   ↓
 * Return User | Throw Exception
 * 
 * Notes:
 * - This strategy is for initial login only
 * - After login, JWT tokens are used for subsequent requests
 * - LocalAuthGuard should include rate limiting
 * - Consider implementing account lockout after failed attempts
 * - Token-based authentication preferred for API clients
 */
