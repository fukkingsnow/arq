import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async findAll(): Promise<Task[]> {
    return await this.taskRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Task> {
    // Используем id as any, чтобы TypeORM не ругался на типы UUID/String
    const task = await this.taskRepository.findOne({ where: { id: id as any } });
    if (!task) throw new NotFoundException(`Task with ID ${id} not found`);
    return task;
  }

  async create(data: Partial<Task>): Promise<Task> {
    const task = this.taskRepository.create(data);
    return await this.taskRepository.save(task);
  }

  // ТОТ САМЫЙ МЕТОД, ИЗ-ЗА КОТОРОГО ВСЁ ПАДАЛО
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
