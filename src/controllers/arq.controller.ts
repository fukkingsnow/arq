import { Controller, Post, Body, Get, HttpCode, HttpStatus, Logger, Param, Patch, NotFoundException } from '@nestjs/common';
import { GitHubService } from '../services/github.service';
import { AutonomousStrategyAnalyzer } from '../services/autonomous-strategy.analyzer';

interface StartDevelopmentDto {
  developmentGoals: string[];
  maxIterations: number;
  priority: 'low' | 'medium' | 'high';
}

@Controller('arq')
export class ARQController {
  private readonly logger = new Logger('ARQController');
  private taskCounter = 0;
  private activeTasks: Map<string, any> = new Map();
  
  constructor(
    private readonly githubService: GitHubService,
    private readonly strategyAnalyzer: AutonomousStrategyAnalyzer,
  ) {}

  @Post('start-development')
  @HttpCode(HttpStatus.CREATED)
  async startDevelopment(@Body() dto: StartDevelopmentDto) {
    const taskId = `arq-dev-${Date.now()}-${++this.taskCounter}`;
    const now = new Date();
    const task = {
      taskId,
      status: 'running',
      createdAt: now,
      goals: dto.developmentGoals,
    };
    this.activeTasks.set(taskId, task);
    return { ...task, message: 'Started' };
  }

  @Get('tasks')
  getAllTasks() {
    return Array.from(this.activeTasks.values());
  }

  @Get('tasks/:taskId')
  getTaskStatus(@Param('taskId') taskId: string) {
    const task = this.activeTasks.get(taskId);
    if (!task) throw new NotFoundException();
    return task;
  }

  @Get('health')
  getHealth() {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  }

  @Get('strategy/analyze')
  async analyzeStrategy() {
    const strategy = await this.strategyAnalyzer.analyzeStrategy();
    return { success: true, strategy };
  }

  @Post('strategy/execute')
  async executeStrategy() {
    try {
      const strategy = await this.strategyAnalyzer.analyzeStrategy();
      await this.strategyAnalyzer.executeStrategy(strategy);
      return { success: true, message: 'Executed', strategy };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
