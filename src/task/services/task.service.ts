import { Injectable, Logger } from '@nestjs/common';
import { DevelopmentTaskEntity } from '../../entities/development-task.entity';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  private tasks: DevelopmentTaskEntity[] = [];
  private taskIdCounter = 1;

  constructor() {}

  async getTask(taskId: string): Promise<DevelopmentTaskEntity | null> {
    try {
      const task = this.tasks.find(t => t.id === taskId);
      return task || null;
    } catch (error) {
      this.logger.error(`Failed to get task: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createTask(taskData: Partial<DevelopmentTaskEntity>): Promise<DevelopmentTaskEntity> {
    try {
      this.logger.log('Creating new task');
      const newTask: DevelopmentTaskEntity = {
        id: `task_${this.taskIdCounter++}`,
        ...taskData,
        status: taskData.status || 'PENDING',
        progress: taskData.progress || 0,
        metrics: taskData.metrics || { lineAdded: 0, lineModified: 0, filesChanged: 0, codeQualityScore: 0 },
      } as DevelopmentTaskEntity;
      this.tasks.push(newTask);
      return newTask;
    } catch (error) {
      this.logger.error(`Failed to create task: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTaskByStatus(status: string): Promise<DevelopmentTaskEntity[]> {
    try {
      return this.tasks.filter(t => t.status === status);
    } catch (error) {
      this.logger.error(`Failed to get tasks by status: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateTaskProgress(taskId: string, progress: number): Promise<DevelopmentTaskEntity | null> {
    try {
      this.logger.log(`Updating task ${taskId} progress to ${progress}`);
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) return null;
      task.progress = progress;
      return task;
    } catch (error) {
      this.logger.error(`Failed to update task progress: ${error.message}`, error.stack);
      throw error;
    }
  }

  async completeTask(taskId: string, result: any): Promise<DevelopmentTaskEntity | null> {
    try {
      this.logger.log(`Completing task ${taskId}`);
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) return null;
      
      task.status = 'COMPLETED';
      task.progress = 100;
      if (task.metrics && result) {
    if (result.linesAdded !== undefined) task.metrics.linesAdded = result.linesAdded;
    if (result.linesModified !== undefined) task.metrics.linesModified = result.linesModified;        if (result.filesChanged !== undefined) task.metrics.filesChanged = result.filesChanged;
        if (result.codeQualityScore !== undefined) task.metrics.codeQualityScore = result.codeQualityScore;
      }
      return task;
    } catch (error) {
      this.logger.error(`Failed to complete task: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteCompletedTasks(daysOld?: number): Promise<number> {
    try {
      this.logger.log(`Deleting completed tasks`);
      const initialCount = this.tasks.length;
      this.tasks = this.tasks.filter(t => t.status !== 'COMPLETED');
      const deletedCount = initialCount - this.tasks.length;
      this.logger.log(`Deleted ${deletedCount} completed tasks`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to delete completed tasks: ${error.message}`, error.stack);
      throw error;
    }
  }

  async failTask(taskId: string, error: string): Promise<DevelopmentTaskEntity | null> {
    try {
      this.logger.log(`Failing task ${taskId}`);
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) return null;
      task.status = 'FAILED';
      task.progress = 100;
      return task;
    } catch (error) {
      this.logger.error(`Failed to fail task: ${error.message}`, error.stack);
      throw error;
    }
  }
}
