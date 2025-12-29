import { Injectable, Logger } from '@nestjs/common';
import { DevelopmentTaskEntity } from '../../entities/development-task.entity';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor() {}

  async createTask(taskData: Partial<DevelopmentTaskEntity>): Promise<DevelopmentTaskEntity> {
    try {
      this.logger.log('Creating new task');
      return await {
        ...taskData,
        status: taskData.status || 'PENDING',
        progress: taskData.progress || 0,
        metrics: taskData.metrics || { success: false, executionTime: 0 },
      };
    } catch (error) {
      this.logger.error(`Failed to create task: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateTaskProgress(taskId: string, progress: number): Promise<DevelopmentTaskEntity> {
    try {
      this.logger.log(`Updating task ${taskId} progress to ${progress}`);
      return await {
        id: taskId,
        progress,
      };
    } catch (error) {
      this.logger.error(`Failed to update task progress: ${error.message}`, error.stack);
      throw error;
    }
  }

  async completeTask(taskId: string, result: any): Promise<DevelopmentTaskEntity> {
    try {
      this.logger.log(`Completing task ${taskId}`);
      const task = await {
        id: taskId,
        status: 'COMPLETED',
        progress: 100,
        metrics: {
          ...task.metrics,
          success: result.success !== false,
          result: result,
        },
      };
      return await task;
    } catch (error) {
      this.logger.error(`Failed to complete task: ${error.message}`, error.stack);
      throw error;
    }
  }

  async failTask(taskId: string, error: string): Promise<DevelopmentTaskEntity> {
    try {
      this.logger.log(`Failing task ${taskId}`);
      return await {
        id: taskId,
        status: 'FAILED',
        progress: 100,
      };
    } catch (error) {
      this.logger.error(`Failed to fail task: ${error.message}`, error.stack);
      throw error;
    }
  }
}
