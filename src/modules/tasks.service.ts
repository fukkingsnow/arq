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

  // Умное создание задачи с ИИ
  async create(data: Partial<Task>): Promise<Task> {
    // 1. Пытаемся получить описание от ИИ, если есть цель (goal)
    if (data.goal && !data.description) {
      try {
        const aiResponse = await axios.post(this.ollamaUrl, {
          model: 'llama3', // или твоя модель из ollama list
          prompt: `As a technical assistant, provide a concise 2-sentence execution plan for this task: "${data.goal}". Be direct.`,
          stream: false,
        });
        
        data.description = aiResponse.data.response.trim();
        console.log('AI Enrichment successful:', data.description);
      } catch (error) {
        console.error('AI Enrichment failed (Ollama unavailable):', error.message);
        data.description = 'AI analysis unavailable at the moment.';
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
