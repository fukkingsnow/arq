import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(data: any): Promise<Task> {
    const task = this.taskRepository.create({
      ...data,
      status: 'pending',
    });
    const savedTask = await this.taskRepository.save(task);
    return Array.isArray(savedTask) ? savedTask[0] : savedTask;
  }

  async findAll(): Promise<Task[]> {
    return this.taskRepository.find();
  }

  async findOne(id: string): Promise<Task | null> {
    return this.taskRepository.findOne({ where: { id } });
  }

  async update(id: string, data: any): Promise<Task | null> {
    await this.taskRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.taskRepository.delete(id);
  }
}
