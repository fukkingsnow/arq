import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContextInteraction } from './types/context.types';
import { ContextManager } from './context.manager';

/**
 * Phase 10: Context Engine Module
 * Registers Advanced Context Management (ACM) service
 * Provides multi-tier memory hierarchy: L1 (hot) → L2 (warm) → L3 (cold)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ContextInteraction]),
  ],
  providers: [ContextManager],
  exports: [ContextManager],
})
export class ContextEngineModule {}
