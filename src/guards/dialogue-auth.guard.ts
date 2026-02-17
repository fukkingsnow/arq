import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class DialogueAuthGuard implements CanActivate {
  private logger = new Logger(DialogueAuthGuard.name);

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user is authenticated
    if (!user) {
      this.logger.warn(
        `Unauthorized dialogue access attempt from ${request.ip}`,
      );
      throw new ForbiddenException('User must be authenticated for dialogue access');
    }

    // Check if user has dialogue permission
    if (!user.permissions || !user.permissions.includes('dialogue:access')) {
      this.logger.warn(
        `User ${user.id} attempted dialogue access without permission`,
      );
      throw new ForbiddenException('User does not have permission to access dialogue');
    }

    this.logger.debug(`User ${user.id} authorized for dialogue access`);
    return true;
  }
}
