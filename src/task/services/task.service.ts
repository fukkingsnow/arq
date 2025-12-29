import { Injectable, Logger } from '@nestjs/common';
import { TaskRepository } from '../repositories/task.repository';
import { DevelopmentTaskEntity } from '../../entities/development-task.entity';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private taskRepository: TaskRepository) {}

  async createTask(taskData: Partial<DevelopmentTaskEntity>): Promise<DevelopmentTaskEntity> {
    try {
      this.logger.log(`Creating new task: ${taskData.title}`);
      return await this.taskRepository.createTask({
        ...taskData,
        status: taskData.status || 'PENDING',
        progress: taskData.progress || 0,
        metrics: taskData.metrics || { success: false, executionTime: 0 },
      });
    } catch (error) {
      this.logger.error(`Failed to create task: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateTaskProgress(taskId: string, progress: number): Promise<DevelopmentTaskEntity> {
    try {
      this.logger.log(`Updating task ${taskId} progress to ${progress}%`);
      return await this.taskRepository.updateTaskStatus(taskId, 'ACTIVE', progress);
    } catch (error) {
      this.logger.error(`Failed to update task progress: ${error.message}`, error.stack);
      throw error;
    }
  }

  async completeTask(taskId: string, result: any): Promise<DevelopmentTaskEntity> {
    try {
      this.logger.log(`Completing task ${taskId}`);
      const task = await this.taskRepository.findOneBy({ id: taskId });
      task.status = 'COMPLETED';
      task.progress = 100;
      task.metrics = {
        ...task.metrics,
        success: result.success !== false,
        result: result,
      };
      task.completedAt = new Date();
      return await this.taskRepository.save(task);
    } catch (error) {
      this.logger.error(`Failed to complete task: ${error.message}`, error.stack);
      throw error;
    }
  }

  async failTask(taskId: string, error: string): Promise<DevelopmentTaskEntity> {
    try {
      this.logger.log(`Failing task ${taskId}: ${error}`);
      const task = await this.taskRepository.findOneBy({ id: taskId });
      task.status = 'FAILED';
      task.metrics = {
        ...task.metrics,
        success: false,
        error: error,
      };
      task.completedAt = new Date();
      return await this.taskRepository.save(task);
    } catch (error) {
      this.logger.error(`Failed to fail task: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTask(taskId: string): Promise<DevelopmentTaskEntity> {
    return this.taskRepository.findOneBy({ id: taskId });
  }

  async getActiveTasks(): Promise<DevelopmentTaskEntity[]> {
    return this.taskRepository.getTasksByStatus('ACTIVE');
  }

  async getTasksByStatus(status: string): Promise<DevelopmentTaskEntity[]> {
    return this.taskRepository.getTasksByStatus(status);
  }

  async getTaskMetrics() {
    return this.taskRepository.getTaskMetrics();
  }

  async getAllTasks(): Promise<DevelopmentTaskEntity[]> {
    return this.taskRepository.find({ order: { createdAt: 'DESC' } });
  }

  async deleteCompletedTasks(daysOld: number = 30): Promise<void> {
    try {
      this.logger.log(`Cleaning up tasks older than ${daysOld} days`);
      await this.taskRepository.deleteOldTasks(daysOld);
    } catch (error) {
      this.logger.error(`Failed to delete old tasks: ${error.message}`, error.stack);
      throw error;
    }
  }
}
