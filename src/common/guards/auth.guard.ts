import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string; permissions: string[] };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'default-secret-key',
      });

      // Validate token expiration
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        throw new UnauthorizedException('Token has expired');
      }

      // Check user permissions if needed
      if (payload.permissions && !this.validatePermissions(payload.permissions)) {
        throw new ForbiddenException('Insufficient permissions');
      }

      request.user = {
        id: payload.sub || payload.id,
        role: payload.role || 'user',
        permissions: payload.permissions || [],
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: AuthenticatedRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private validatePermissions(permissions: string[]): boolean {
    const requiredPermissions = ['browser:control', 'browser:read'];
    return requiredPermissions.some((perm) => permissions.includes(perm));
  }
}
