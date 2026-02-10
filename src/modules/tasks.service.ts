import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(data: any): Promise<Task> {
    this.logger.log(`Creating task in Postgres: ${data.title}`);
    const task = this.taskRepository.create({
      ...data,
      status: data.status || 'pending',
    });
    return await this.taskRepository.save(task);
  }

  async findAll(): Promise<Task[]> {
    return await this.taskRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Task | null> {
    return await this.taskRepository.findOne({ where: { id } });
  }

  async updateStatus(id: string, status: string, progress?: number): Promise<Task | null> {
    this.logger.log(`Updating task ${id} to status: ${status}, progress: ${progress}%`);
    await this.taskRepository.update(id, { 
      status, 
      ...(progress !== undefined && { progress }), // если в таблице есть поле progress
      updatedAt: new Date() 
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.taskRepository.delete(id);
  }

  // Метод для воркера или админки: найти все активные
  async findByStatus(status: string): Promise<Task[]> {
    return await this.taskRepository.find({ where: { status } });
  }
}
