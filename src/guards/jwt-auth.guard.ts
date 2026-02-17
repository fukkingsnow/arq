import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard - Provides JWT token validation for protected routes
 * Uses Passport JWT strategy to verify access tokens
 * Throws UnauthorizedException if token is invalid or missing
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Validate and attach user to request if JWT is valid
   * Inherited from AuthGuard, handles token verification
   */
  canActivate(context: any) {
    return super.canActivate(context);
  }

  /**
   * Handle authentication failure
   * Throws UnauthorizedException with error message
   */
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('JWT authentication failed');
    }
    return user;
  }
}
