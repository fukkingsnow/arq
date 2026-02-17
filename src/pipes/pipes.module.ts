import { Module } from '@nestjs/common';
import { ValidationPipe } from './validation/validation.pipe';
import { TransformPipe } from './transform/transform.pipe';
import { ContextEnrichmentPipe } from './context/context-enrichment.pipe';
import { RoutingPipe } from './routing/routing.pipe';
import { IntentParsingPipe } from './intent/intent-parsing.pipe';
import { PipePipelineFactory } from './pipeline/pipe-pipeline.factory';

/**
 * PipesModule - Phase 32 Implementation
 * 
 * Provides the dialogue processing pipeline infrastructure for the ARQ backend.
 * All pipes are responsible for transforming, validating, enriching, and routing
 * dialogue contexts through a configurable execution pipeline.
 * 
 * Exported Pipes:
 * - ValidationPipe: Validates required fields in dialogue context
 * - TransformPipe: Transforms context data with multiple operations
 * - ContextEnrichmentPipe: Enriches context with metadata and analysis
 * - RoutingPipe: Routes dialogue to appropriate handlers
 * - IntentParsingPipe: Parses user intents from natural language
 * - PipePipelineFactory: Orchestrates pipe execution
 */
@Module({
  providers: [
    ValidationPipe,
    TransformPipe,
    ContextEnrichmentPipe,
    RoutingPipe,
    IntentParsingPipe,
    PipePipelineFactory,
  ],
  exports: [
    ValidationPipe,
    TransformPipe,
    ContextEnrichmentPipe,
    RoutingPipe,
    IntentParsingPipe,
    PipePipelineFactory,
  ],
})
export class PipesModule {}
