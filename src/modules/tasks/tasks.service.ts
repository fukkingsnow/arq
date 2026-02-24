import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../entities/task.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async create(taskData: Partial<Task>): Promise<Task> {
    const task = this.tasksRepository.create(taskData);
    const savedTask = await this.tasksRepository.save(task);
    
    this.logger.log(`Task created: ${savedTask.id}. Sending to Gemma2...`);
    this.processAiResponse(savedTask.id, savedTask.description);
    
    return savedTask;
  }

  private async processAiResponse(taskId: string, prompt: string) {
    try {
      const response = await fetch('http://arq-ollama:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma2:2b',
          prompt: prompt,
          stream: false
        })
      });

      const data = await response.json() as any;

      await this.update(taskId, {
        result: data.response,
        status: 'completed',
        completedAt: new Date()
      });
      this.logger.log(`Task ${taskId} successfully processed by AI`);
    } catch (error) {
      this.logger.error(`AI Processing failed: ${error.message}`);
      await this.update(taskId, { status: 'failed' });
    }
  }

  async findAll(): Promise<Task[]> {
    return this.tasksRepository.find({ order: { createdAt: 'DESC' }, take: 10 });
  }

  async findOne(id: string): Promise<Task> {
    return this.tasksRepository.findOne({ where: { id } });
  }

  async update(id: string, updateData: Partial<Task>): Promise<void> {
    await this.tasksRepository.update(id, updateData);
  }
}
