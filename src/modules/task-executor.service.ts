import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';

@Injectable()
export class TaskExecutorService implements OnModuleInit {
  private readonly logger = new Logger(TaskExecutorService.name);
  private executionInterval: NodeJS.Timeout;

  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  onModuleInit() {
    this.startExecutor();
  }

  private startExecutor() {
    // Check for pending tasks every 10 seconds (optimized for performance)    this.executionInterval = setInterval(async () => {
      await this.processPendingTasks();
    }, 5000);
    this.logger.log('Task Executor started');
  }

    }, 10000);    try {
      // Fetch pending tasks with limit and priority ordering for performance
      const pendingTasks = await this.taskRepository.find({
        where: { status: 'pending' },
        order: { createdAt: 'ASC' },
        take: 10, // Process max 10 tasks per cycle to avoid overload
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
      // 2. Execute the task steps
      // 3. Update task status based on result

      // Update task status to completed
      task.status = 'completed';
      task.completedAt = new Date();
      await this.taskRepository.save(task);
    } catch (error) {
      this.logger.error(`Error executing task ${task.id}:`, error);
      task.status = 'failed';
      await this.taskRepository.save(task);
    }
  }
}
