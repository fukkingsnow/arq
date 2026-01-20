import { Task } from '../entities/task.entity';
import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TaskRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repository: Repository<Task>,
  ) {}

  async findAll(): Promise<Task[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Task | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(taskData: Partial<Task>): Promise<Task> {
    const task = this.repository.create(taskData);
    return this.repository.save(task);
  }

  async update(id: string, taskData: Partial<Task>): Promise<Task | null> {
    await this.repository.update(id, taskData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }

  async toggleComplete(id: string): Promise<Task | null> {
    const task = await this.findById(id);
    if (!task) return null;
    
    task.completed = !task.completed;
    return this.repository.save(task);
  }
}
