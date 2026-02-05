import { Injectable, Logger } from '@nestjs/common';
import { GitHubService } from './github.service';
import { MetricsService } from './metrics.service';
import { FileSystemService } from './file-system.service';

export interface StrategyScore {
  category: string;
  score: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommendations: string[];
}

export interface DevelopmentStrategy {
  timestamp: Date;
  overallScore: number;
  focusAreas: StrategyScore[];
  nextSteps: string[];
  risks: string[];
  opportunities: string[];
}

export interface RepositoryMetrics {
  openIssues: number;
  openPRs: number;
  failedTests: number;
  codeQualityScore: number;
  performanceMetrics: Record<string, number>;
}

@Injectable()
export class AutonomousStrategyAnalyzer {
  private readonly logger = new Logger(AutonomousStrategyAnalyzer.name);
  private strategyCache: DevelopmentStrategy | null = null;
  private lastAnalysis: Date | null = null;
  private analysisInterval = 300000; // 5 min

  constructor(
    private readonly githubService: GitHubService,
    private readonly metricsService: MetricsService,
    private readonly fileSystem: FileSystemService,
  ) {
    this.logger.log('AutonomousStrategyAnalyzer initialized with Full Autonomy');
  }

  async analyzeStrategy(): Promise<DevelopmentStrategy> {
    try {
      // ВРЕМЕННО ОТКЛЮЧАЕМ КЭШ ДЛЯ ТЕСТОВ АВТОНОМНОСТИ
      /*
      if (this.strategyCache && this.lastAnalysis && Date.now() - this.lastAnalysis.getTime() < this.analysisInterval) {
        return this.strategyCache;
      }
      */
      
      const metrics = await this.gatherMetrics();
      const focusAreas = await this.calculateFocusAreas(metrics);
      const strategy = await this.generateStrategy(metrics, focusAreas);
      
      this.strategyCache = strategy;
      this.lastAnalysis = new Date();
      return strategy;
    } catch (error) {
      this.logger.error(`Analysis failed: ${error.message}`);
      throw error;
    }
  }

  private async gatherMetrics(): Promise<RepositoryMetrics> {
    // Убрали общий try-catch, чтобы видеть ошибки в логах
    const [openIssues, openPRs] = await Promise.all([
      this.githubService.listIssues('open').catch(() => []), // GitHub может упасть, это не критично
      this.githubService.listPullRequests('open').catch(() => []),
    ]);

    let integrity = { frontendSynced: true, backendPrefix: 'v1' };
    
    if (typeof (this.metricsService as any).checkInternalIntegrity === 'function') {
      integrity = await (this.metricsService as any).checkInternalIntegrity();
      this.logger.log(`[ARQ-DEBUG] Integrity check result: synced=${integrity.frontendSynced}, prefix=${integrity.backendPrefix}`);
    }

    return {
      openIssues: openIssues.length,
      openPRs: openPRs.length,
      failedTests: integrity.frontendSynced ? 0 : 1,
      codeQualityScore: integrity.frontendSynced ? 85 : 10, // Снижаем счет, если не синхронизировано
      performanceMetrics: { api_integrity: integrity.frontendSynced ? 1 : 0 },
    };
  }

  private async calculateFocusAreas(metrics: RepositoryMetrics): Promise<StrategyScore[]> {
    const areas: StrategyScore[] = [];
    
    if (metrics.failedTests > 0) {
      areas.push({
        category: 'System Integrity',
        score: 10,
        priority: 'critical',
        recommendations: ['Fix API Prefix mismatch between backend and frontend'],
      });
    }

    areas.push({
      category: 'Code Quality',
      score: metrics.codeQualityScore,
      priority: metrics.codeQualityScore < 50 ? 'critical' : 'medium',
      recommendations: ['Perform system health audit'],
    });

    return areas;
  }

  private async generateStrategy(metrics: RepositoryMetrics, focusAreas: StrategyScore[]): Promise<DevelopmentStrategy> {
    const overallScore = focusAreas.length > 0 
      ? Math.min(...focusAreas.map(a => a.score)) // Берем худший результат как главный
      : 100;

    return {
      timestamp: new Date(),
      overallScore: Math.round(overallScore),
      focusAreas: focusAreas.sort((a, b) => this.priorityToNumber(b.priority) - this.priorityToNumber(a.priority)),
      nextSteps: focusAreas.flatMap(f => f.recommendations).slice(0, 3),
      risks: metrics.failedTests > 0 ? ['API Sync Error detected'] : [],
      opportunities: [],
    };
  }

  private priorityToNumber(p: string): number {
    return { critical: 4, high: 3, medium: 2, low: 1 }[p] || 0;
  }

  async executeStrategy(strategy: DevelopmentStrategy): Promise<void> {
    this.logger.log(`[ARQ-EXECUTE] Starting autonomous repair cycle. Score: ${strategy.overallScore}`);

    for (const area of strategy.focusAreas) {
      if (area.category === 'System Integrity' && area.priority === 'critical') {
        this.logger.log('[ARQ] Critical Integrity Issue found. Patching index.html...');
        
        const integrity = await (this.metricsService as any).checkInternalIntegrity();
        
        if (!integrity.frontendSynced) {
          // ВАЖНО: Проверь путь к index.html в твоем FileSystemService
          const success = await this.fileSystem.replaceInFile(
            'frontend/dist/index.html',
            /fetch\(['"]\/api\/health['"]\)/g,
            `fetch('/api/${integrity.backendPrefix}/health')`
          );

          if (success) {
            this.logger.log('✅ [ARQ] SUCCESSFULLY PATCHED index.html with correct API prefix.');
          } else {
            this.logger.error('❌ [ARQ] Failed to patch index.html automatically.');
          }
        }
      }
    }
  }
}
