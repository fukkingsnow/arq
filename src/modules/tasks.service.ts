import { Injectable } from '@nestjs/common';
import { TaskRepository } from '../repositories/task-repository';
import { Task } from '../entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    private readonly taskRepository: TaskRepository,
  ) {}

  async create(data: any): Promise<Task> {
        console.log('[TasksService] create() called with data:', JSON.stringify(data, null, 2));
    try {
            const result = await this.taskRepository.create(data);
            console.log('[TasksService] Task created successfully:', JSON.stringify(result, null, 2));
            return result;
          } catch (error) {
            console.error('[TasksService] Error creating task:', error);
            throw error;
          }
  }

  async findAll(): Promise<Task[]> {
    return await this.taskRepository.findAll();
  }

  async findOne(id: string): Promise<Task | null> {
    return await this.taskRepository.findById(id);
  }

  async update(id: string, data: any): Promise<Task | null> {
    await this.taskRepository.update(id, data);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.taskRepository.delete(id);
  }
}
