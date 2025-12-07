/**
 * Centralized exports for all application services.
 * Phase 26-31: Core, domain, and utility services
 */

// Phase 26: Core Services
export { AuditService } from './audit.service';
export { AuthService } from './auth.service';
export { BrowserService } from './browser.service';
export { SessionService } from './session.service';
export { UserService } from './user.service';

// Phase 31: Advanced Services
export { BaseService, type IPaginationMeta, type IPaginatedResponse } from './base.service';
export { CacheService, type ICacheEntry, type ICacheStats } from './cache.service';
export { EmailService, type IEmailConfig, type IEmailContent, type IEmailResult } from './email.service';

/**
 * Service providers array for NestJS module registration.
 * Includes all domain services for dependency injection.
 */
/* export const SERVICE_PROVIDERS = [
  AuditService,
  AuthService,
  BrowserService,
  CacheService,
  EmailService,
  SessionService,
  UserService,
  BaseService,
];


