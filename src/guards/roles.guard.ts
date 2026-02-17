import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * RolesGuard - Enforces role-based access control
 * Checks user roles against required roles specified by @Roles decorator
 * Integrates with JWT authentication for user context
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Extract required roles from route metadata (@Roles decorator)
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    
    // If no specific roles required, allow access
    if (!requiredRoles) {
      return true;
    }

    // Get request object from execution context
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Ensure user is authenticated
    if (!user) {
      return false;
    }

    // Extract user roles from request.user
    const userRoles = user.roles || [];

    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));
    
    return hasRequiredRole;
  }
}
