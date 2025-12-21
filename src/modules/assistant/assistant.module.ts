import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssistantController } from './assistant.controller';
import { QueryAnalyzerService } from './services/query-analyzer.service';
import { StatusQueryService } from './services/status-query.service';
import { ErrorDetectionService } from './services/error-detection.service';
import { RecommendationService } from './services/recommendation.service';
import { Task } from '../tasks/entities/task.entity';
import { ConversationLog } from './entities/conversation-log.entity';
import { QueryCache } from './entities/query-cache.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, ConversationLog, QueryCache])],
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
