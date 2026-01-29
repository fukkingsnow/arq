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

  // --- MCP STATUS ENDPOINTS ---

  @Get('status/mcp')
  @HttpCode(HttpStatus.OK)
  getMcpStatus() {
    return {
      status: 'online',
      protocol: 'MCP JSON-RPC 2.0',
      tools: ['execute_command', 'read_file_content'],
      info: 'To use tools, send POST to /mcp'
    };
  }

  // --- DEVELOPMENT CORE ---

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
        progress: 10,
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
        message: 'Development cycle started',
        timestamp: now,
      };
    } catch (error) {
      this.logger.error(`[ARQ] Error: ${error.message}`);
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

  @Post('tasks/submit')
  @HttpCode(HttpStatus.CREATED)
  submitTask(@Body() dto: { goal: string; description: string; taskType: string; tags: string[] }) {
    const taskId = `task-${Date.now()}-${++this.taskCounter}`;
    const now = new Date();
    
    const task: DevelopmentTask = {
      taskId,
      status: 'queued',
      branch: '',
      createdAt: now,
      developmentGoals: [dto.goal],
      currentIteration: 0,
      progress: 0,
      startTime: now.toISOString(),
      lastUpdate: now.toISOString(),
      currentPhase: dto.taskType,
      metrics: { linesAdded: 0, linesModified: 0, filesChanged: 0, codeQualityScore: 0 },
    };
    
    this.activeTasks.set(taskId, task);
    return { success: true, taskId, timestamp: now.toISOString() };
  }

  @Get('tasks/:taskId')
  getTaskStatus(@Param('taskId') taskId: string) {
    const task = this.activeTasks.get(taskId);
    return task ? { ...task, createdAt: task.createdAt.toISOString() } : { error: 'Not found' };
  }

  @Patch('tasks/:taskId/pause')
  pauseTask(@Param('taskId') taskId: string) {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.status = 'paused';
      task.lastUpdate = new Date().toISOString();
    }
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
      endpoints: ['/arq/start-development', '/arq/health', '/arq/tasks', '/arq/status/mcp']
    };
  }

  @Get('strategy/analyze')
  async analyzeStrategy() {
    try {
      const strategy = await this.strategyAnalyzer.analyzeStrategy();
      return { success: true, strategy, timestamp: new Date().toISOString() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('strategy/execute')
  async executeStrategy() {
    try {
      const strategy = await this.strategyAnalyzer.analyzeStrategy();
      await this.strategyAnalyzer.executeStrategy(strategy);
      return { success: true, message: 'Execution initiated', strategy };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
