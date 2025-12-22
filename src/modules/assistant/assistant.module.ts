import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { QueryAnalyzerService } from './services/query-analyzer.service';
import { StatusQueryService } from './services/status-query.service';
import { ErrorDetectionService } from './services/error-detection.service';

@Module({
  controllers: [AssistantController],
  providers: [
    QueryAnalyzerService,
    StatusQueryService,
    ErrorDetectionService,
  ],
  exports: [
    QueryAnalyzerService,
    StatusQueryService,
    ErrorDetectionService,
  ],
})
export class AssistantModule {}
