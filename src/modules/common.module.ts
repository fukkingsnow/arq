import { Module } from '@nestjs/common';
import { CommonService } from '../services/common.service';
import { MetricsService } from '../services/metrics.service';
import { AutonomousStrategyAnalyzer } from '../services/autonomous-strategy.analyzer';
import { FileSystemService } from '../services/file-system.service';

/**
 * Common Feature Module
 * Провайдеры для автономной работы ARQ
 */
@Module({
  providers: [
    CommonService,
    MetricsService,
    AutonomousStrategyAnalyzer,
    FileSystemService
  ],
  exports: [
    CommonService,
    MetricsService,
    AutonomousStrategyAnalyzer,
    FileSystemService
  ],
})
export class CommonModule {}
