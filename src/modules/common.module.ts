import { Module } from '@nestjs/common';
import { CommonService } from '../services/common.service';

/**
 * Common Feature Module
 *
 * Provides shared utilities and common services including:
 * - Error handling and exception filters
 * - Custom decorators and guards
 * - Utility interceptors and pipes
 * - Cross-cutting concerns (logging, validation)
 */
@Module({
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
