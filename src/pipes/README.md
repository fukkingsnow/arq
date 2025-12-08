# ARQ Pipes Module - Phase 32

## Overview

The Pipes Module provides a modular, composable dialogue processing pipeline architecture for the ARQ backend. All pipes are responsible for transforming, validating, enriching, and routing dialogue contexts through a configurable execution pipeline.

## Architecture

### Core Pipes

#### 1. ValidationPipe (Priority: 100)
Validates required fields in dialogue context and ensures data integrity.

**Features:**
- Validates required fields (message, userId, sessionId)
- Checks field format and type safety
- Returns detailed validation errors

```typescript
const result = await validationPipe.execute(context);
if (!result.success) {
  console.error(result.error); // Validation failed
}
```

#### 2. IntentParsingPipe (Priority: 90)
Parses user intents from natural language commands using regex-based detection.

**Supported Intents:**
- navigate: Navigate to a page or element
- click: Click on an element
- search: Perform a search
- scroll: Scroll the page
- type: Type text input
- wait: Wait for a condition
- close: Close something

```typescript
const result = await intentParsingPipe.execute({
  message: 'click on the login button',
  userId: 'user123',
  sessionId: 'session123'
});
```

#### 3. TransformPipe (Priority: 70)
Transforms dialogue context data with multiple built-in transformations.

**Available Transformations:**
- toLowerCase: Convert string to lowercase
- toUpperCase: Convert string to uppercase
- trim: Remove whitespace
- parseInt: Parse to integer
- parseFloat: Parse to float
- toString: Convert to string
- jsonStringify: Convert to JSON string
- jsonParse: Parse JSON string

#### 4. ContextEnrichmentPipe (Priority: 60)
Enriches dialogue context with intelligent metadata and analysis.

**Enrichment Features:**
- Timestamp enrichment (enrichedAt)
- Conversation depth tracking
- User agent analysis
- Message sentiment analysis
- Language detection
- Priority score calculation

```typescript
const result = await enrichmentPipe.execute(context);
const enriched = result.data;
console.log(enriched.metadata.messageSentiment); // 'positive', 'negative', or 'neutral'
console.log(enriched.metadata.priorityScore); // 0-100
```

#### 5. RoutingPipe (Priority: 50)
Routes dialogue to appropriate handlers based on message content.

**Default Routes:**
- /help: For help and assistance requests
- /order: For order and purchase requests
- /support: For support and issue requests
- /info: For information requests
- /default: Fallback route

## Pipeline Execution

### Default Pipeline Order
1. ValidationPipe (validates input)
2. ContextEnrichmentPipe (enriches with metadata)
3. IntentParsingPipe (parses user intent)
4. TransformPipe (transforms data)
5. RoutingPipe (routes to handler)

### Using PipePipelineFactory

```typescript
import { PipePipelineFactory } from './pipeline/pipe-pipeline.factory';

// Execute default pipeline
const result = await pipelineFactory.executePipeline(context);

// Execute with options
const result = await pipelineFactory.executePipeline(context, undefined, {
  stopOnError: true,
  logExecution: true
});

// Create custom pipeline
const customPipeline = pipelineFactory.createCustomPipeline([
  validationPipe,
  enrichmentPipe,
  routingPipe
]);
```

## Module Integration

### Importing in Your Module

```typescript
import { Module } from '@nestjs/common';
import { PipesModule } from './pipes/pipes.module';

@Module({
  imports: [PipesModule],
  // ... rest of module config
})
export class DialogueModule {}
```

### Using in Services

```typescript
import { Injectable } from '@nestjs/common';
import { PipePipelineFactory } from './pipes/pipeline/pipe-pipeline.factory';

@Injectable()
export class DialogueService {
  constructor(private pipelineFactory: PipePipelineFactory) {}

  async processDialogue(context: DialogContext) {
    return this.pipelineFactory.executePipeline(context);
  }
}
```

## Testing

Comprehensive unit tests are provided in `pipes.spec.ts` covering:
- Individual pipe functionality
- Pipeline execution workflows
- Error handling scenarios
- Custom pipeline creation

```bash
# Run tests
npm test -- pipes.spec.ts
```

## Extension Points

### Creating Custom Pipes

1. Extend BasePipe
2. Implement IPipe interface
3. Add @Injectable() decorator
4. Register in PipesModule

```typescript
import { Injectable } from '@nestjs/common';
import { BasePipe } from './base/base.pipe';
import { IPipe } from './interfaces/pipe.interface';

@Injectable()
export class CustomPipe extends BasePipe implements IPipe {
  constructor() {
    super('CustomPipe', {
      description: 'My custom pipe',
      version: '1.0.0',
      priority: 75,
      enabled: true,
    });
  }

  async execute(context: DialogContext): Promise<PipeResult> {
    // Your implementation
  }
}
```

### Registering Custom Routes

```typescript
routingPipe.registerRoute('/custom', async (context) => {
  // Handle custom route
  return { success: true };
});
```

## Architecture Diagram

```
Dialogue Context
      |
      v
[ValidationPipe] (Priority: 100)
      |
      v
[ContextEnrichmentPipe] (Priority: 60)
      |
      v
[IntentParsingPipe] (Priority: 90)
      |
      v
[TransformPipe] (Priority: 70)
      |
      v
[RoutingPipe] (Priority: 50)
      |
      v
Processed Context & Route Handler
```

## Performance Considerations

- Pipes execute sequentially with priority-based ordering
- Each pipe can stop execution on error if configured
- Metadata enrichment is cached per session
- Intent parsing uses compiled regex patterns for efficiency

## Future Enhancements

- Async route handlers
- Pipe middleware support
- Caching layer integration
- Analytics and monitoring
- Custom transformation plugins

## Contributing

When adding new pipes:
1. Follow the existing pipe structure
2. Add comprehensive tests
3. Update this README
4. Register in PipesModule

## Files

- `pipes.module.ts` - NestJS module definition
- `base/base.pipe.ts` - Abstract base class
- `interfaces/pipe.interface.ts` - Pipe contract definitions
- `validation/validation.pipe.ts` - Input validation
- `intent/intent-parsing.pipe.ts` - Intent parsing
- `transform/transform.pipe.ts` - Data transformation
- `context/context-enrichment.pipe.ts` - Context enrichment
- `routing/routing.pipe.ts` - Route handling
- `pipeline/pipe-pipeline.factory.ts` - Pipeline orchestration
- `pipes.spec.ts` - Unit tests
- `index.ts` - Module barrel export
