import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * IsPublic - Decorator to mark endpoints as publicly accessible
 * When applied to a route, it bypasses JWT authentication guard
 * Usage: @IsPublic() on top of controller method
 */
export const IsPublic = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    request.isPublic = true;
    return null;
  },
);

/**
 * CurrentUser - Decorator to inject authenticated user from request
 * Extracts user object from JWT payload attached to request
 * Usage: @CurrentUser() in controller method parameters
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * Roles - Decorator to specify required roles for a route
 * Works with RolesGuard to enforce role-based access control
 * Usage: @Roles('admin', 'user') on top of controller method
 */
export const Roles = (...roles: string[]) => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata('roles', roles, descriptor?.value || target);
    return descriptor;
  };
};
