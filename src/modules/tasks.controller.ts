import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from '../entities/task.entity';

@Controller()
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get('health')
  healthCheck() {
    return { 
      status: 'ok', 
      service: 'arq-api',
      timestamp: new Date().toISOString() 
    };
  }

  @Post('submit')
  async create(@Body() data: any): Promise<Task> {
    return this.tasksService.create(data);
  }

  @Get('tasks')
  async findAll(): Promise<Task[]> {
    return this.tasksService.findAll();
  }

  @Get('tasks/:id')
  async findOne(@Param('id') id: string): Promise<Task> {
    return this.tasksService.findOne(id);
  }

  @Put('tasks/:id')
  async update(@Param('id') id: string, @Body() data: any): Promise<Task> {
    return this.tasksService.update(id, data);
  }

  @Delete('tasks/:id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.tasksService.remove(id);
  }
}
