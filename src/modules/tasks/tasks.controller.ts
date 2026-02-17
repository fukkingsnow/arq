import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from '../../entities/task.entity';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
  ) {}

  @Post()
  async create(@Body() taskData: Partial<Task>) {
    // Вся магия (и база, и очередь) теперь внутри сервиса
    return await this.tasksService.create(taskData);
  }

  @Get()
  async findAll() {
    return await this.tasksService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.tasksService.findOne(id);
  }
}
