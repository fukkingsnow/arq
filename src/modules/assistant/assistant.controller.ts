import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { QueryAnalyzerService } from './services/query-analyzer.service';
import { StatusQueryService } from './services/status-query.service';
import { ErrorDetectionService } from './services/error-detection.service';
import { RecommendationService } from './services/recommendation.service';
import { QueryDto } from './dto/query.dto';

@Controller('api/v1/assistant')
export class AssistantController {
  constructor(
    private readonly queryAnalyzer: QueryAnalyzerService,
    private readonly statusQuery: StatusQueryService,
    private readonly errorDetection: ErrorDetectionService,
    private readonly recommendation: RecommendationService,
  ) {}

  @Post('query')
  async handleQuery(@Body() queryDto: QueryDto) {
    const analysis = await this.queryAnalyzer.analyzeQuery(queryDto.query);
    
    switch (analysis.intent) {
      case 'STATUS':
        return await this.statusQuery.getTaskStatus(analysis.entityId);
      case 'ERROR':
        return await this.errorDetection.detectErrors(analysis.entityId);
      case 'HELP':
        return this.recommendation.getRecommendations(analysis.context);
      default:
        return { response: 'Query understood but no specific action', analysis };
    }
  }

  @Get('status/:taskId')
  async getStatus(@Param('taskId') taskId: string) {
    return await this.statusQuery.getTaskStatus(taskId);
  }

  @Get('errors/:taskId')
  async getErrors(@Param('taskId') taskId: string) {
    return await this.errorDetection.detectErrors(taskId);
  }

  @Get('recommendations')
  async getRecommendations() {
    return await this.recommendation.getRecommendations({});
  }
}
