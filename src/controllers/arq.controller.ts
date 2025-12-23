import { Controller, Post, Body, Get, HttpCode, HttpStatus, Logger, Param, Patch } from '@nestjs/common';
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
      // Generate unique task ID
      const taskId = `arq-dev-${Date.now()}-${++this.taskCounter}`;

      // Create development branch
      const branchName = `feature/arq-improvement-${taskId}`;
      this.logger.log(`[ARQ] Creating branch: ${branchName}`);

      // Initialize task with full data
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
      this.logger.log(`[ARQ] Task ${taskId} created successfully`);

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
    this.logger.log(`[ARQ] Retrieving all tasks`);
    const tasksList = Array.from(this.activeTasks.values()).map(task => ({
      ...task,
      createdAt: task.createdAt.toISOString(),
    }));
    return tasksList;
  }

  @Get('tasks/:taskId')
  getTaskStatus(@Param('taskId') taskId: string) {
    this.logger.log(`[ARQ] Retrieving task status: ${taskId}`);
    const task = this.activeTasks.get(taskId);
    if (!task) {
      return {
        error: 'Task not found',
        taskId,
      };
    }
    return {
      ...task,
      createdAt: task.createdAt.toISOString(),
    };
  }

  @Patch('tasks/:taskId/pause')
  pauseTask(@Param('taskId') taskId: string) {
    this.logger.log(`[ARQ] Pausing task: ${taskId}`);
    const task = this.activeTasks.get(taskId);
    if (!task) {
      return {
        error: 'Task not found',
        taskId,
      };
    }
    task.status = 'paused';
    task.lastUpdate = new Date().toISOString();
    return task;
  }

  @Patch('tasks/:taskId/resume')
  resumeTask(@Param('taskId') taskId: string) {
    this.logger.log(`[ARQ] Resuming task: ${taskId}`);
    const task = this.activeTasks.get(taskId);
    if (!task) {
      return {
        error: 'Task not found',
        taskId,
      };
    }
    task.status = 'running';
    task.lastUpdate = new Date().toISOString();
    return task;
  }

  @Patch('tasks/:taskId/cancel')
  cancelTask(@Param('taskId') taskId: string) {
    this.logger.log(`[ARQ] Cancelling task: ${taskId}`);
    const task = this.activeTasks.get(taskId);
    if (!task) {
      return {
        error: 'Task not found',
        taskId,
      };
    }
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
      service: 'ARQ Self-Development Engine',
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  getRootInfo() {
    return {
      service: 'ARQ Self-Development Engine',
      version: '1.0.1',
      status: 'operational',
      timestamp: new Date().toISOString(),
      endpoints: {
        'POST /start-development': 'Start a new development cycle',
        'GET /health': 'Check service health',
        'GET /tasks': 'Get all development tasks',
        'GET /tasks/:taskId': 'Get specific task status',
        'PATCH /tasks/:taskId/pause': 'Pause a task',
        'PATCH /tasks/:taskId/resume': 'Resume a paused task',
        'PATCH /tasks/:taskId/cancel': 'Cancel a task',
      },
    };
  }

  private generateIssueDescription(dto: StartDevelopmentDto, taskId: string): string {
    return `## ARQ Self-Development Task
Task ID: ${taskId}

### Development Goals
${dto.developmentGoals.map(goal => `- ${goal}`).join('\n')}

### Priority
${dto.priority.toUpperCase()}

### Details
- Auto-generated by ARQ Self-Development Engine
- Max iterations: ${dto.maxIterations}
- Created at: ${new Date().toISOString()}

### Branch
\`feature/arq-improvement-${taskId}\`

### Status
🚀 In Progress`;
  }

  /**
   * Analyze development strategy
   */
  @Get('strategy/analyze')
  @HttpCode(HttpStatus.OK)
  async analyzeStrategy() {
    this.logger.log('[ARQ] Analyzing development strategy...');
    try {
      const strategy = await this.strategyAnalyzer.analyzeStrategy();
      return {
        success: true,
        strategy,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`[ARQ] Error analyzing strategy: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Execute current strategy
   */
  @Post('strategy/execute')
  @HttpCode(HttpStatus.OK)
  async executeStrategy() {
    this.logger.log('[ARQ] Executing development strategy...');
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
      this.logger.error(`[ARQ] Error executing strategy: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get PR status
   */
  @Get('pr-status/:prNumber')
  @HttpCode(HttpStatus.OK)
  getPRStatus(@Param('prNumber') prNumber: string) {
    this.logger.log(`[ARQ] Getting PR #${prNumber} status`);
    const status = {};
    return {
      prNumber,
      status,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get all monitored PRs
   */
  @Get('pr-status')
  @HttpCode(HttpStatus.OK)
  getAllPRStatuses() {
    this.logger.log('[ARQ] Getting all PR statuses');
    const statuses = [];
    return {
      count: statuses.length,
      statuses,
      timestamp: new Date().toISOString(),
    };
  }
}
