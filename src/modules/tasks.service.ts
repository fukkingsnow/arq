import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import axios from 'axios';

@Injectable()
export class TasksService {
  private get ollamaUrl() {
    const baseUrl = process.env.OLLAMA_URL || 'http://arq-ollama:11434';
    return `${baseUrl.replace(/\/$/, '')}/api/generate`;
  }

  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async create(data: any): Promise<Task> {
    // Используем unknown как промежуточный тип, чтобы TS не ругался
    const task = this.taskRepository.create(data) as unknown as Task;
    
    try {
      const response = await axios.post(this.ollamaUrl, {
        model: 'gemma2:2b',
        prompt: `Create a short step-by-step action plan for this task: ${data.title}`,
        stream: false,
      });
      
      if (response.data && response.data.response) {
        task.description = response.data.response;
      }
    } catch (error) {
      console.error('Ollama Error:', error.message);
      task.description = 'Task created without AI plan (AI service offline).';
    }

    return this.taskRepository.save(task);
  }

  async findAll(): Promise<Task[]> {
    return this.taskRepository.find();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    return task || null;
  }

  async update(id: string, data: any): Promise<Task> {
    await this.taskRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.taskRepository.delete(id);
  }
}
