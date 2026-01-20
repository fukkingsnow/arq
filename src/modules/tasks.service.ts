import { Injectable } from '@nestjs/common';
import { TaskRepository } from '../repositories/task-repository';
import { Task } from '../entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    private readonly taskRepository: TaskRepository,
  ) {}

  async create(data: any): Promise<Task> {
    return this.taskRepository.create({
      ...data,
      status: 'pending',
    });
  }

  async findAll(): Promise<Task[]> {
    return this.taskRepository.findAll();
  }

  async findOne(id: string): Promise<Task | null> {
    return this.taskRepository.findById(id);
  }

  async update(id: string, data: any): Promise<Task | null> {
    return this.taskRepository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.taskRepository.delete(id);
  }
}
