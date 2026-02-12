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
    // 1. Извлекаем заголовок, проверяя разные варианты ключей
    const taskTitle = data.title || data.name || data.task || 'New Task';
    
    // 2. Создаем объект задачи, гарантируя заполнение обязательных полей
    const task = this.taskRepository.create({
      title: taskTitle,
      description: data.description || 'Generating AI plan...',
      priority: data.priority || 'medium',
      status: 'pending'
    });

    try {
      // 3. Запрос к Ollama
      const response = await axios.post(this.ollamaUrl, {
        model: process.env.OLLAMA_MODEL || 'gemma2:2b',
        prompt: `Create a short step-by-step action plan for this task: ${taskTitle}`,
        stream: false,
      }, { timeout: 30000 }); // Увеличим таймаут до 30с для медленных ИИ

      if (response.data && response.data.response) {
        task.description = response.data.response;
      }
    } catch (error) {
      console.error('Ollama Error:', error.message);
      // Если ИИ упал, оставляем описание из ввода или ставим дефолт
      if (task.description === 'Generating AI plan...') {
        task.description = data.description || 'Task created, but AI plan is unavailable.';
      }
    }

    // 4. Сохраняем и возвращаем
    return this.taskRepository.save(task);
  }

  async findAll(): Promise<Task[]> {
    return this.taskRepository.find({
      order: { createdAt: 'DESC' } // Свежие задачи сверху
    });
  }

  async findOne(id: string): Promise<Task> {
    return this.taskRepository.findOne({ where: { id } });
  }

  async update(id: string, data: any): Promise<Task> {
    await this.taskRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.taskRepository.delete(id);
  }
}
