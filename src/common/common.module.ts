import { Module } from '@nestjs/common';
import {
  CacheService,
  EmailVerificationService,
  EventEmitterService,
  FileUploadService,
  LoggerService,
  RateLimitService,
  ValidationService
} from './services';

const SERVICES = [
  CacheService,
  EmailVerificationService,
  EventEmitterService,
  FileUploadService,
  LoggerService,
  RateLimitService,
  ValidationService
];

/**
 * Common Module
 * 
 * Phase 22 Backend Services Module
 * 
 * Provides centralized access to all common services:
 * - CacheService: In-memory caching with TTL support
 * - EmailVerificationService: Token generation and email verification
 * - EventEmitterService: Event-driven architecture with async support
 * - FileUploadService: File upload and management
 * - LoggerService: Production logging with file rotation
 * - RateLimitService: Rate limiting with sliding windows
 * - ValidationService: Comprehensive data validation
 * 
 * Usage:
 * import { CommonModule } from './common';
 * 
 * @Module({
 *   imports: [CommonModule],
 *   // Services are automatically available for injection
 * })
 * export class MyModule {}
 */
@Module({
  providers: SERVICES,
  exports: SERVICES
})
export class CommonModule {}
