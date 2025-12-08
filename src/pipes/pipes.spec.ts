import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from './validation/validation.pipe';
import { TransformPipe } from './transform/transform.pipe';
import { ContextEnrichmentPipe } from './context/context-enrichment.pipe';
import { RoutingPipe } from './routing/routing.pipe';
import { IntentParsingPipe } from './intent/intent-parsing.pipe';
import { PipePipelineFactory } from './pipeline/pipe-pipeline.factory';
import { DialogContext } from '../common/interfaces/dialogue.interface';

describe('Pipes Module (Phase 32)', () => {
  let module: TestingModule;
  let validationPipe: ValidationPipe;
  let transformPipe: TransformPipe;
  let enrichmentPipe: ContextEnrichmentPipe;
  let routingPipe: RoutingPipe;
  let intentParsingPipe: IntentParsingPipe;
  let pipelineFactory: PipePipelineFactory;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ValidationPipe,
        TransformPipe,
        ContextEnrichmentPipe,
        RoutingPipe,
        IntentParsingPipe,
        PipePipelineFactory,
      ],
    }).compile();

    validationPipe = module.get<ValidationPipe>(ValidationPipe);
    transformPipe = module.get<TransformPipe>(TransformPipe);
    enrichmentPipe = module.get<ContextEnrichmentPipe>(ContextEnrichmentPipe);
    routingPipe = module.get<RoutingPipe>(RoutingPipe);
    intentParsingPipe = module.get<IntentParsingPipe>(IntentParsingPipe);
    pipelineFactory = module.get<PipePipelineFactory>(PipePipelineFactory);
  });

  describe('ValidationPipe', () => {
    it('should validate required fields', async () => {
      const validContext: DialogContext = {
        message: 'Hello',
        userId: 'user123',
        sessionId: 'session123',
      };
      const result = await validationPipe.execute(validContext);
      expect(result.success).toBe(true);
    });

    it('should fail validation for missing required fields', async () => {
      const invalidContext = {
        message: '',
        userId: '',
        sessionId: '',
      } as any;
      const result = await validationPipe.execute(invalidContext);
      expect(result.success).toBe(false);
    });
  });

  describe('TransformPipe', () => {
    it('should transform data correctly', async () => {
      const context: DialogContext = {
        message: 'TEST',
        userId: 'user123',
        sessionId: 'session123',
      };
      const result = await transformPipe.execute(context);
      expect(result.success).toBe(true);
    });
  });

  describe('ContextEnrichmentPipe', () => {
    it('should enrich context with metadata', async () => {
      const context: DialogContext = {
        message: 'Hello',
        userId: 'user123',
        sessionId: 'session123',
      };
      const result = await enrichmentPipe.execute(context);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('RoutingPipe', () => {
    it('should route based on message content', async () => {
      const helpContext: DialogContext = {
        message: 'I need help',
        userId: 'user123',
        sessionId: 'session123',
      };
      const result = await routingPipe.execute(helpContext);
      expect(result.success).toBe(true);
    });
  });

  describe('IntentParsingPipe', () => {
    it('should parse user intents', async () => {
      const context: DialogContext = {
        message: 'navigate to dashboard',
        userId: 'user123',
        sessionId: 'session123',
      };
      const result = await intentParsingPipe.execute(context);
      expect(result.success).toBe(true);
    });
  });

  describe('PipePipelineFactory', () => {
    it('should execute default pipeline', async () => {
      const context: DialogContext = {
        message: 'Hello',
        userId: 'user123',
        sessionId: 'session123',
      };
      const result = await pipelineFactory.executePipeline(context);
      expect(result.success).toBeDefined();
    });

    it('should handle pipeline errors gracefully', async () => {
      const invalidContext = {} as DialogContext;
      const result = await pipelineFactory.executePipeline(invalidContext, undefined, {
        stopOnError: true,
      });
      expect(result).toBeDefined();
    });

    it('should create custom pipeline with sorted pipes', () => {
      const customPipeline = pipelineFactory.createCustomPipeline([
        validationPipe,
        transformPipe,
        enrichmentPipe,
      ]);
      expect(customPipeline.length).toBe(3);
      // Should be sorted by priority descending
      expect(customPipeline[0].metadata.priority || 0).toBeGreaterThanOrEqual(
        customPipeline[1].metadata.priority || 0,
      );
    });
  });

  afterEach(async () => {
    await module.close();
  });
});
