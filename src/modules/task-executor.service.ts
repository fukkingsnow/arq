import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';

@Injectable()
export class TaskExecutorService implements OnModuleInit {
  private readonly logger = new Logger(TaskExecutorService.name);
  private executionInterval: NodeJS.Timeout;
  // URL Ollama внутри Docker-сети
  private readonly OLLAMA_URL = 'http://arq-ollama:11434/api/generate';

  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  onModuleInit() {
    this.startExecutor();
  }

  private startExecutor() {
    this.executionInterval = setInterval(async () => {
      await this.processPendingTasks();
    }, 5000);
    this.logger.log('Task Executor started with Ollama integration');
  }

  private async processPendingTasks() {
    try {
      const pendingTasks = await this.taskRepository.find({
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
      this.logger.log(`--- Starting AI Task: ${task.title} ---`);
      
      // 1. Ставим статус "в процессе", чтобы другие воркеры не перехватили
      task.status = 'processing';
      await this.taskRepository.save(task);

      // 2. Формируем запрос к Gemma
      const prompt = `You are an AI assistant. Task: ${task.title}. \nDetails: ${task.description}`;
      
      this.logger.log(`Sending request to Ollama (gemma2:2b)...`);
      
      const response = await fetch(this.OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma2:2b',
          prompt: prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama connection failed: ${response.statusText}`);
      }

      const data = await response.json() as { response: string };
      
      // 3. Сохраняем результат генерации прямо в описание
      this.logger.log(`AI generation successful for task: ${task.id}`);
      
      task.description = `[AI ANSWER]: ${data.response}\n\n[ORIGINAL]: ${task.description}`;
      task.status = 'completed';
      task.completedAt = new Date();
      
      await this.taskRepository.save(task);
      this.logger.log(`Task ${task.title} marked as completed.`);

    } catch (error) {
      this.logger.error(`Failed to execute task ${task.id}:`, error.message);
      task.status = 'failed';
      // Сохраняем ошибку в описание, чтобы понимать что пошло не так
      task.description = `[ERROR]: ${error.message}\n\n${task.description}`;
      await this.taskRepository.save(task);
    }
  }
}
