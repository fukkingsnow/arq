import { Controller, Post, Body, Get, HttpCode, HttpStatus, Logger, Param, Patch, NotFoundException } from '@nestjs/common';
import { GitHubService } from '../services/github.service';
import { AutonomousStrategyAnalyzer } from '../services/autonomous-strategy.analyzer';

interface StartDevelopmentDto {
  developmentGoals: string[];
  maxIterations: number;
  priority: 'low' | 'medium' | 'high';
}

interface TaskMetrics {
  linesAdded: number;
  linesModified: number;
  filesChanged: number;
  codeQualityScore: number;
}

interface DevelopmentTask {
  taskId: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled' | 'queued' | 'in_progress';
  branch: string;
  createdAt: Date;
  developmentGoals: string[];
  currentIteration: number;
  progress: number;
  startTime: string;
  lastUpdate: string;
  currentPhase: string;
  metrics: TaskMetrics;
  estimatedCompletion?: string;
}

@Controller('arq')
export class ARQController {
  private readonly logger = new Logger('ARQController');
  private taskCounter = 0;
  private activeTasks: Map<string, DevelopmentTask> = new Map();
  
  constructor(
    private readonly githubService: GitHubService,
    private readonly strategyAnalyzer: AutonomousStrategyAnalyzer,
  ) {}

  @Post('start-development')
  @HttpCode(HttpStatus.CREATED)
  async startDevelopment(@Body() dto: StartDevelopmentDto) {
    this.logger.log(`[ARQ] Starting development cycle with goals: ${dto.developmentGoals.join(', ')}`);
    try {
      const taskId = `arq-dev-${Date.now()}-${++this.taskCounter}`;
      const branchName = `feature/arq-improvement-${taskId}`;
      const now = new Date();

      const task: DevelopmentTask = {
        taskId,
        status: 'running',
        branch: branchName,
        createdAt: now,
        developmentGoals: dto.developmentGoals,
        currentIteration: 1,
        progress: Math.floor(Math.random() * 40) + 10,
        startTime: now.toISOString(),
        lastUpdate: now.toISOString(),
        currentPhase: 'Initialization',
        metrics: {
          linesAdded: 0,
          linesModified: 0,
          filesChanged: 0,
          codeQualityScore: 0,
        },
        estimatedCompletion: new Date(now.getTime() + 3600000).toISOString(),
      };

      this.activeTasks.set(taskId, task);
      return {
        taskId,
        status: task.status,
        branch: branchName,
        goals: dto.developmentGoals,
        message: 'Development cycle started',
        timestamp: now,
      };
    } catch (error) {
      this.logger.error(`[ARQ] Error starting development: ${error.message}`);
      throw error;
    }
  }

  @Get('tasks')
  getAllTasks() {
    return Array.from(this.activeTasks.values()).map(task => ({
      ...task,
      createdAt: task.createdAt.toISOString(),
    }));
  }

  @Get('tasks/:taskId')
  getTaskStatus(@Param('taskId') taskId: string) {
    const task = this.activeTasks.get(taskId);
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    return { ...task, createdAt: task.createdAt.toISOString() };
  }

  @Patch('tasks/:taskId/pause')
  pauseTask(@Param('taskId') taskId: string) {
    const task = this.activeTasks.get(taskId);
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    task.status = 'paused';
    task.lastUpdate = new Date().toISOString();
    return task;
  }

  @Patch('tasks/:taskId/resume')
  resumeTask(@Param('taskId') taskId: string) {
    const task = this.activeTasks.get(taskId);
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    task.status = 'running';
    task.lastUpdate = new Date().toISOString();
    return task;
  }

  @Patch('tasks/:taskId/cancel')
  cancelTask(@Param('taskId') taskId: string) {
    const task = this.activeTasks.get(taskId);
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    task.status = 'cancelled';
    task.lastUpdate = new Date().toISOString();
    return task;
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      activeTasks: this.activeTasks.size,
    };
  }

  @Get()
  getRootInfo() {
    return {
      service: 'ARQ Engine',
      version: '1.0.1',
      status: 'operational',
      timestamp: new Date().toISOString()
    };
  }

  @Get('strategy/analyze')
  async analyzeStrategy() {
    const strategy = await this.strategyAnalyzer.analyzeStrategy();
    return { success: true, strategy, timestamp: new Date().toISOString() };
  }

  @Post('strategy/execute')
  async executeStrategy() {
    try {
      const strategy = await this.strategyAnalyzer.analyzeStrategy();
      await this.strategyAnalyzer.executeStrategy(strategy);
      return {
        success: true,
        message: 'Strategy execution initiated',
        strategy,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
