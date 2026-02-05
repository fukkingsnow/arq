import { Injectable, Logger } from '@nestjs/common';
import { GitHubService } from './github.service';
import { MetricsService } from './metrics.service';

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
  private analysisInterval = 300000; // Уменьшено до 5 минут для быстрой реакции

  constructor(
    private readonly githubService: GitHubService,
    private readonly metricsService: MetricsService,
  ) {
    this.logger.log('AutonomousStrategyAnalyzer initialized with System Integrity Awareness');
  }

  async analyzeStrategy(): Promise<DevelopmentStrategy> {
    try {
      if (this.strategyCache && this.lastAnalysis && Date.now() - this.lastAnalysis.getTime() < this.analysisInterval) {
        return this.strategyCache;
      }

      const metrics = await this.gatherMetrics();
      const focusAreas = await this.calculateFocusAreas(metrics);
      const strategy = await this.generateStrategy(metrics, focusAreas);

      this.strategyCache = strategy;
      this.lastAnalysis = new Date();
      return strategy;
    } catch (error) {
      this.logger.error(`Failed to analyze strategy: ${error.message}`);
      throw error;
    }
  }

  /**
   * ПЕРЕРАБОТАНО: Сбор метрик теперь включает системную проверку
   */
  private async gatherMetrics(): Promise<RepositoryMetrics> {
    try {
      const [openIssues, openPRs] = await Promise.all([
        this.githubService.listIssues('open'),
        this.githubService.listPullRequests('open'),
      ]);

      // Вызываем наш новый метод интроспекции
      const integrity = await this.metricsService.checkInternalIntegrity();

      return {
        openIssues: openIssues.length,
        openPRs: openPRs.length,
        // Если фронтенд не синхронизирован, помечаем это как критический провал теста
        failedTests: integrity.frontendSynced ? 0 : 1,
        // Снижаем оценку качества при рассинхроне
        codeQualityScore: integrity.frontendSynced ? 85 : 30,
        performanceMetrics: {
          api_integrity: integrity.frontendSynced ? 1 : 0
        },
      };
    } catch (error) {
      this.logger.error(`Failed to gather metrics: ${error.message}`);
      return { openIssues: 0, openPRs: 0, failedTests: 1, codeQualityScore: 0, performanceMetrics: {} };
    }
  }

  private async calculateFocusAreas(metrics: RepositoryMetrics): Promise<StrategyScore[]> {
    const areas: StrategyScore[] = [];

    // Блок тестирования и целостности
    if (metrics.failedTests > 0) {
      areas.push({
        category: 'System Integrity & Testing',
        score: 0,
        priority: 'critical',
        recommendations: [
          'Fix API Prefix mismatch between backend and frontend',
          'Ensure index.html fetch paths match NestJS global prefix',
          'Verify service availability after build'
        ],
      });
    }

    // Стандартные блоки
    areas.push({
      category: 'Code Quality',
      score: metrics.codeQualityScore,
      priority: metrics.codeQualityScore < 50 ? 'critical' : 'medium',
      recommendations: ['Refactor inconsistent API paths', 'Audit architectural integrity'],
    });

    return areas;
  }

  private async generateStrategy(metrics: RepositoryMetrics, focusAreas: StrategyScore[]): Promise<DevelopmentStrategy> {
    const overallScore = focusAreas.reduce((sum, a) => sum + a.score, 0) / focusAreas.length;

    return {
      timestamp: new Date(),
      overallScore: Math.round(overallScore),
      focusAreas: focusAreas.sort((a, b) => this.priorityToNumber(b.priority) - this.priorityToNumber(a.priority)),
      nextSteps: focusAreas.flatMap(f => f.recommendations).slice(0, 5),
      risks: metrics.failedTests > 0 ? ['Critical API mismatch detected - frontend is DOWN'] : [],
      opportunities: metrics.codeQualityScore > 80 ? ['System is stable - ready for new features'] : [],
    };
  }

  private priorityToNumber(priority: string): number {
    const map = { critical: 4, high: 3, medium: 2, low: 1 };
    return map[priority] || 0;
  }

  async executeStrategy(strategy: DevelopmentStrategy): Promise<void> {
    this.logger.log(`Executing strategy: ${strategy.overallScore}. Focus: ${strategy.focusAreas[0]?.category}`);
    // Логика Чекпоинта №2 (CodeMorpher) будет вызываться здесь
  }
}
