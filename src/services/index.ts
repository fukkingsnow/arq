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
export { TabService } from './tab.service';
export { NavigationService } from './navigation.service';
export { DOMService } from './dom.service';

// Phase 31: Advanced Services
export { BaseService, type IPaginationMeta, type IPaginatedResponse } from './base.service';
export { CacheService, type ICacheEntry, type ICacheStats } from './cache.service';
export { EmailService, type IEmailConfig, type IEmailContent, type IEmailResult } from './email.service';

// Phase 33: Dialogue Services
export { DialogueService } from './dialogue.service';
export { ConversationManager } from './conversation.manager';
export { DialogueHistoryService } from './dialogue-history.service';
export { WorkflowService } from './workflow.service';
export { WorkflowRepository } from './workflow.repository';
export { WorkflowEngineService } from './workflow-engine.service';
export { StepExecutorService } from './step-executor.service';

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
    TabService,
      NavigationService,
        DOMService,
  BaseService,
    DialogueService,
  ConversationManager,
  DialogueHistoryService,
];
*/


