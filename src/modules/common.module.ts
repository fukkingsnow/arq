import { Module } from '@nestjs/common';
import { CommonService } from '../services/common.service';
import { MetricsService } from '../services/metrics.service';
import { AutonomousStrategyAnalyzer } from '../services/autonomous-strategy.analyzer';
import { FileSystemService } from '../services/file-system.service';
import { GitHubService } from '../services/github.service'; // ДОБАВИТЬ ЭТОТ ИМПОРТ

@Module({
  providers: [
    CommonService,
    MetricsService,
    AutonomousStrategyAnalyzer,
    FileSystemService,
    GitHubService, // ДОБАВИТЬ СЮДА
  ],
  exports: [
    CommonService,
    MetricsService,
    AutonomousStrategyAnalyzer,
    FileSystemService,
    GitHubService, // И СЮДА
  ],
})
export class CommonModule {}
