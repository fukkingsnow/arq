import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { QueryAnalyzerService } from './services/query-analyzer.service';
import { StatusQueryService } from './services/status-query.service';
import { ErrorDetectionService } from './services/error-detection.service';
import { RecommendationService } from './services/recommendation.service';

@Module({
  controllers: [AssistantController],
  providers: [
    QueryAnalyzerService,
    StatusQueryService,
    ErrorDetectionService,
    RecommendationService,
  ],
  exports: [
    QueryAnalyzerService,
    StatusQueryService,
    ErrorDetectionService,
    RecommendationService,
  ],
})
export class AssistantModule {}
