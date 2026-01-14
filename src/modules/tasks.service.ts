import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { CreateTaskDto } from '../dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
const task = this.taskRepository.create({ ...createTaskDto, status: 'pending' });
    return this.taskRepository.save(task)  }

  async findAll(): Promise<Task[]> {
    return this.tasksRepository.find();
  }

  async findOne(id: string): Promise<Task> {
    return this.tasksRepository.findOne({ where: { id } });
  }

  async update(id: string, createTaskDto: CreateTaskDto): Promise<Task> {
    await this.tasksRepository.update(id, createTaskDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.tasksRepository.delete(id);
  }
}
