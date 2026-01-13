task-executor.service.tsimport { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';

@Injectable()
export class TaskExecutorService implements OnModuleInit {
  private readonly logger = new Logger(TaskExecutorService.name);
  private executionInterval: NodeJS.Timeout;

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  onModuleInit() {
    this.startExecutor();
  }

  private startExecutor() {
    // Check for pending tasks every 5 seconds
    this.executionInterval = setInterval(async () => {
      await this.processPendingTasks();
    }, 5000);
    this.logger.log('Task Executor started');
  }

  private async processPendingTasks() {
    try {
      const pendingTasks = await this.tasksRepository.find({
        where: { status: 'pending' },
      });

      for (const task of pendingTasks) {
        await this.executeTask(task);
      }
    } catch (error) {
      this.logger.error('Error processing pending tasks:', error);
    }
  }

  private async executeTask(task: Task) {
    try {
      this.logger.log(`Executing task: ${task.title}`);
      
      // Simulate task execution
      // In a real system, this would:
      // 1. Call AI service to process task
      // 2. Execute subtasks
      // 3. Generate reports
      
      // Update task status to completed
      task.status = 'completed';
      await this.tasksRepository.save(task);
      
      this.logger.log(`Task completed: ${task.title}`);
    } catch (error) {
      this.logger.error(`Error executing task ${task.id}:`, error);
      task.status = 'failed';
      await this.tasksRepository.save(task);
    }
  }

  onModuleDestroy() {
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
    }
  }
}
