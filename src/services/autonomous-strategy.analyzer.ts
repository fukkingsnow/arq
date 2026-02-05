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
  private analysisInterval = 300000; // 5 min

  constructor(
    private readonly githubService: GitHubService,
    private readonly metricsService: MetricsService,
  ) {
    this.logger.log('AutonomousStrategyAnalyzer initialized');
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
      this.logger.error(`Analysis failed: ${error.message}`);
      throw error;
    }
  }

  private async gatherMetrics(): Promise<RepositoryMetrics> {
    try {
      const [openIssues, openPRs] = await Promise.all([
        this.githubService.listIssues('open'),
        this.githubService.listPullRequests('open'),
      ]);

      // Безопасный вызов метода интроспекции
      let integrity = { frontendSynced: true };
      if (typeof (this.metricsService as any).checkInternalIntegrity === 'function') {
        integrity = await (this.metricsService as any).checkInternalIntegrity();
      }

      return {
        openIssues: openIssues.length,
        openPRs: openPRs.length,
        failedTests: integrity.frontendSynced ? 0 : 1,
        codeQualityScore: integrity.frontendSynced ? 85 : 30,
        performanceMetrics: { api_integrity: integrity.frontendSynced ? 1 : 0 },
      };
    } catch (error) {
      return { openIssues: 0, openPRs: 0, failedTests: 0, codeQualityScore: 50, performanceMetrics: {} };
    }
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
    const overallScore = focusAreas.length > 0 ? focusAreas.reduce((sum, a) => sum + a.score, 0) / focusAreas.length : 100;
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
    this.logger.log(`Executing strategy... Score: ${strategy.overallScore}`);
  }
}
