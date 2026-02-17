import { Injectable, Logger } from '@nestjs/common';
import { GitHubService } from './github.service';
import { MetricsService } from './metrics.service';
import { FileSystemService } from './file-system.service';
import axios from 'axios';

@Injectable()
export class AutonomousStrategyAnalyzer {
  private readonly logger = new Logger(AutonomousStrategyAnalyzer.name);

  constructor(
    private readonly githubService: GitHubService,
    private readonly metricsService: MetricsService,
    private readonly fileSystem: FileSystemService,
  ) {
    this.logger.log('ARQ: AI Strategy Analyzer Ready');
  }

  async analyzeStrategy() {
    const metrics = await this.gatherMetrics();
    const focusAreas = this.calculateFocusAreas(metrics);
    
    // Попытка получить совет от Ollama
    let aiAdvice = "Perform standard system audit";
    try {
      const ollamaRes = await axios.post('http://arq-ollama:11434/api/generate', {
        model: 'gemma2:2b',
        prompt: `System status: Issues ${metrics.openIssues}, Sync ${metrics.failedTests === 0}. What is the priority?`,
        stream: false
      }, { timeout: 60000 });
      aiAdvice = ollamaRes.data.response;
      this.logger.log('ARQ: AI Insight received');
    } catch (e) {
      this.logger.warn('ARQ: Ollama offline, using local heuristics');
    }

    return {
      timestamp: new Date(),
      overallScore: metrics.failedTests > 0 ? 10 : 100,
      focusAreas,
      nextSteps: [...focusAreas.flatMap(f => f.recommendations), aiAdvice].slice(0, 3),
      risks: metrics.failedTests > 0 ? ['API Sync Error'] : [],
      opportunities: []
    };
  }

  private async gatherMetrics() {
    const issues = await this.githubService.listIssues('open').catch(() => []);
    const integrity = await this.metricsService.checkInternalIntegrity();

    return {
      openIssues: issues.length,
      failedTests: integrity.frontendSynced ? 0 : 1,
      codeQualityScore: integrity.frontendSynced ? 90 : 20,
    };
  }

  private calculateFocusAreas(metrics: any) {
    const areas = [];
    if (metrics.failedTests > 0) {
      areas.push({
        category: 'System Integrity',
        score: 10,
        priority: 'critical',
        recommendations: ['Fix API Prefix in /app/src/frontend/index.html'],
      });
    }
    return areas;
  }

  async executeStrategy(strategy: any) {
    this.logger.log('[ARQ] Starting repair cycle...');
    const integrity = await this.metricsService.checkInternalIntegrity();

    if (!integrity.frontendSynced) {
      // ПУТЬ ИСПРАВЛЕН НА /app/src/frontend/index.html
      const path = 'src/frontend/index.html'; 
      const targetPrefix = `/api/${integrity.backendPrefix}/health`;

      const success = await this.fileSystem.replaceInFile(
        path,
        /fetch\(['"]\/api\/(?:[^\/]+\/)?health['"]\)/g,
        `fetch('${targetPrefix}')`
      );

      if (success) {
        this.logger.log(`✅ [ARQ] SUCCESSFULLY PATCHED ${path}`);
      } else {
        this.logger.error(`❌ [ARQ] Could not patch ${path}. Check FileSystemService base path.`);
      }
    }
  }
}
