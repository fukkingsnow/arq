import { SetMetadata } from '@nestjs/common';

/**
 * Permissions Decorator - Mark required permissions for route
 *
 * Usage: @Permissions('browser:control', 'browser:read')
 * Stores required permissions in metadata for guards to check
 */
export const PERMISSIONS_KEY = 'permissions';

export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
