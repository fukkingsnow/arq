import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from '../entities/task.entity';

@Controller('v1/arq/tasks')export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post('submit')
  async create(@Body() data: any): Promise<Task> {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  async findAll(): Promise<Task[]> {
    return this.tasksService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Task> {
    return this.tasksService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() createTaskDto: CreateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(id, createTaskDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.tasksService.remove(id);
  }
}
