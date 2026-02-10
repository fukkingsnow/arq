import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import axios from 'axios';

@Injectable()
export class TasksService {
  private readonly ollamaUrl = process.env.OLLAMA_URL || 'http://ollama:11434/api/generate';

  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async findAll(): Promise<Task[]> {
    return await this.taskRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id: id as any } });
    if (!task) throw new NotFoundException(`Task with ID ${id} not found`);
    return task;
  }

  async create(data: Partial<Task>): Promise<Task> {
    // Используем Gemma для генерации плана на основе TITLE
    if (data.title && !data.description) {
      try {
        const aiResponse = await axios.post(this.ollamaUrl, {
          model: 'gemma',
          prompt: `Context: Project Management. 
                   Task Title: "${data.title}". 
                   Act as a technical lead. Provide a professional 1-sentence execution plan.`,
          stream: false,
        });
        
        data.description = aiResponse.data.response.trim();
        console.log('Gemma successfully enriched the task description!');
      } catch (error) {
        console.error('Ollama/Gemma error:', error.message);
        data.description = 'AI plan unavailable.';
      }
    }

    const task = this.taskRepository.create(data);
    return await this.taskRepository.save(task);
  }

  async update(id: string, data: Partial<Task>): Promise<Task> {
    const task = await this.findOne(id);
    Object.assign(task, data);
    return await this.taskRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
  }
}
