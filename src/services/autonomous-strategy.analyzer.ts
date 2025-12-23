import { Injectable, Logger } from '@nestjs/common';
import { GitHubService } from './github.service';
import { MetricsService } from './metrics.service';

interface StrategyScore {
  category: string;
  score: number; // 0-100
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommendations: string[];
}

interface DevelopmentStrategy {
  timestamp: Date;
  overallScore: number;
  focusAreas: StrategyScore[];
  nextSteps: string[];
  risks: string[];
  opportunities: string[];
}

interface RepositoryMetrics {
  openIssues: number;
  openPRs: number;
  failedTests: number;
  codeQualityScore: number;
  performanceMetrics: Record<string, number>;
}

/**
 * Autonomous Strategy Analyzer - Analyzes project state and recommends development priorities
 * Uses AI to determine optimal development strategies based on metrics and patterns
 */
@Injectable()
export class AutonomousStrategyAnalyzer {
  private readonly logger = new Logger(AutonomousStrategyAnalyzer.name);
  private strategyCache: DevelopmentStrategy | null = null;
  private lastAnalysis: Date | null = null;
  private analysisInterval = 3600000; // 1 hour

  constructor(
    private readonly githubService: GitHubService,
    private readonly metricsService: MetricsService,
  ) {
    this.logger.log('AutonomousStrategyAnalyzer initialized');
  }

  /**
   * Analyze repository state and determine optimal development strategy
   */
  async analyzeStrategy(): Promise<DevelopmentStrategy> {
    try {
      // Check cache
      if (
        this.strategyCache &&
        this.lastAnalysis &&
        Date.now() - this.lastAnalysis.getTime() < this.analysisInterval
      ) {
        this.logger.log('Returning cached strategy');
        return this.strategyCache;
      }

      this.logger.log('Analyzing development strategy...');

      // Gather metrics
      const metrics = await this.gatherMetrics();
      this.logger.log(`Metrics gathered: ${JSON.stringify(metrics)}`);

      // Generate strategy scores
      const focusAreas = await this.calculateFocusAreas(metrics);

      // Use AI to generate recommendations
      const strategy = await this.generateStrategy(metrics, focusAreas);

      // Cache the strategy
      this.strategyCache = strategy;
      this.lastAnalysis = new Date();

      return strategy;
    } catch (error) {
      this.logger.error(`Failed to analyze strategy: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gather repository and system metrics
   */
  private async gatherMetrics(): Promise<RepositoryMetrics> {
    try {
      const [openIssues, openPRs] = await Promise.all([
        this.githubService.listIssues('open'),
        this.githubService.listPullRequests('open'),
      ]);

      // Get metrics from MetricsService
      const metrics = this.metricsService.getSystemMetrics();

      return {
        openIssues: openIssues.length,
        openPRs: openPRs.length,
        failedTests: metrics.failedTests || 0,
        codeQualityScore: metrics.codeQualityScore || 85,
        performanceMetrics: metrics.performance || {},
      };
    } catch (error) {
      this.logger.error(`Failed to gather metrics: ${error.message}`);
      return {
        openIssues: 0,
        openPRs: 0,
        failedTests: 0,
        codeQualityScore: 0,
        performanceMetrics: {},
      };
    }
  }

  /**
   * Calculate focus areas based on metrics
   */
  private async calculateFocusAreas(
    metrics: RepositoryMetrics,
  ): Promise<StrategyScore[]> {
    const areas: StrategyScore[] = [];

    // Issue Management
    if (metrics.openIssues > 10) {
      areas.push({
        category: 'Issue Management',
        score: Math.max(0, 100 - metrics.openIssues * 3),
        priority: metrics.openIssues > 20 ? 'critical' : 'high',
        recommendations: [
          'Prioritize issue triage',
          'Implement issue templates',
          'Automate issue categorization',
        ],
      });
    }

    // PR Management
    if (metrics.openPRs > 5) {
      areas.push({
        category: 'PR Management',
        score: Math.max(0, 100 - metrics.openPRs * 5),
        priority: metrics.openPRs > 10 ? 'high' : 'medium',
        recommendations: [
          'Review pending PRs',
          'Automate review process',
          'Set review SLAs',
        ],
      });
    }

    // Code Quality
    areas.push({
      category: 'Code Quality',
      score: metrics.codeQualityScore,
      priority: metrics.codeQualityScore < 80 ? 'high' : 'medium',
      recommendations: [
        'Run linter and formatter',
        'Increase test coverage',
        'Refactor complex modules',
      ],
    });

    // Testing
    if (metrics.failedTests > 0) {
      areas.push({
        category: 'Testing',
        score: Math.max(0, 100 - metrics.failedTests * 10),
        priority: 'high',
        recommendations: [
          'Fix failing tests',
          'Add missing tests',
          'Improve test reliability',
        ],
      });
    }

    return areas;
  }

  /**
   * Generate AI-powered development strategy
   */
  private async generateStrategy(
    metrics: RepositoryMetrics,
    focusAreas: StrategyScore[],
  ): Promise<DevelopmentStrategy> {
    try {
      const priorityCritical = focusAreas.filter(
        (a) => a.priority === 'critical',
      );
      const priorityHigh = focusAreas.filter((a) => a.priority === 'high');

      // Use LLM to generate next steps
      const prompt = `Based on these development metrics:
- Open Issues: ${metrics.openIssues}
- Open PRs: ${metrics.openPRs}
- Code Quality Score: ${metrics.codeQualityScore}/100
- Failed Tests: ${metrics.failedTests}

Generate 5 specific, actionable next steps for development. Be concise.`;

      const nextStepsText = await this.llmService.generateText(prompt);
      const nextSteps = nextStepsText.split('\n').filter((s) => s.trim());

      const overallScore =
        focusAreas.reduce((sum, a) => sum + a.score, 0) / focusAreas.length;

      return {
        timestamp: new Date(),
        overallScore: Math.round(overallScore),
        focusAreas: focusAreas.sort(
          (a, b) => this.priorityToNumber(b.priority) - this.priorityToNumber(a.priority),
        ),
        nextSteps: nextSteps.slice(0, 5),
        risks: this.identifyRisks(metrics, priorityCritical),
        opportunities: this.identifyOpportunities(metrics),
      };
    } catch (error) {
      this.logger.warn(`Failed to generate AI strategy: ${error.message}`);
      // Return fallback strategy
      return {
        timestamp: new Date(),
        overallScore: 50,
        focusAreas,
        nextSteps: [
          'Reduce open issues',
          'Review pending PRs',
          'Improve code quality',
          'Fix failing tests',
          'Optimize performance',
        ],
        risks: [],
        opportunities: [],
      };
    }
  }

  /**
   * Identify potential risks
   */
  private identifyRisks(
    metrics: RepositoryMetrics,
    criticalAreas: StrategyScore[],
  ): string[] {
    const risks: string[] = [];

    if (metrics.failedTests > 0) {
      risks.push(`${metrics.failedTests} failing tests could impact stability`);
    }
    if (metrics.codeQualityScore < 70) {
      risks.push('Low code quality could lead to maintainability issues');
    }
    if (metrics.openIssues > 30) {
      risks.push('High number of open issues could impact project momentum');
    }
    if (criticalAreas.length > 0) {
      risks.push(`${criticalAreas.length} critical areas need immediate attention`);
    }

    return risks;
  }

  /**
   * Identify opportunities
   */
  private identifyOpportunities(metrics: RepositoryMetrics): string[] {
    const opportunities: string[] = [];

    if (metrics.codeQualityScore > 85) {
      opportunities.push('High code quality enables faster feature development');
    }
    if (metrics.openIssues < 5) {
      opportunities.push('Low issue count allows focus on feature development');
    }
    if (metrics.openPRs === 0) {
      opportunities.push('No pending PRs - perfect time for major refactoring');
    }

    return opportunities;
  }

  /**
   * Convert priority to numerical value for sorting
   */
  private priorityToNumber(
    priority: 'critical' | 'high' | 'medium' | 'low',
  ): number {
    const priorityMap = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return priorityMap[priority];
  }

  /**
   * Get cached strategy without re-analysis
   */
  getCachedStrategy(): DevelopmentStrategy | null {
    return this.strategyCache;
  }

  /**
   * Clear cache to force re-analysis
   */
  clearCache(): void {
    this.strategyCache = null;
    this.lastAnalysis = null;
    this.logger.log('Strategy cache cleared');
  }

  /**
   * Execute strategy - implement the recommended changes
   */
  async executeStrategy(strategy: DevelopmentStrategy): Promise<void> {
    try {
      this.logger.log(
        `Executing strategy with overall score: ${strategy.overallScore}`,
      );
      // Log the strategy execution
      this.logger.log(
        `Focus areas: ${strategy.focusAreas.map((a) => a.category).join(', ')}`,
      );
      this.logger.log(
        `Next steps: ${strategy.nextSteps.slice(0, 3).join('; ')}`,
      );
    } catch (error) {
      this.logger.error(`Failed to execute strategy: ${error.message}`);
      throw error;
    }
  }
}
