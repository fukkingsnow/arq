import { Controller, Get, Post, Body } from '@nestjs/common';
import { TasksService } from './modules/tasks/tasks.service';

@Controller()
export class AppController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('tasks')
  async getTasks() {
    return await this.tasksService.findAll();
  }

  @Post('tasks')
  async createTask(@Body() task: any) {
    return await this.tasksService.create({
      title: task.title || 'Untitled',
      description: task.prompt || task.description || '',
      status: 'pending',
      goal: task.goal || 'General'
    });
  }
}
