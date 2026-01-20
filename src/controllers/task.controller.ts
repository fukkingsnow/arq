import { Controller, Get, Post, Body, Param, HttpStatus, HttpCode, Res } from '@nestjs/common';
import { Response } from 'express';
import { TasksService } from '../modules/tasks.service';

@Controller('api/v1/arq')
export class TaskController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('tasks/submit')
  @HttpCode(HttpStatus.ACCEPTED)
  async submitTask(@Body() body: any, @Res() res: Response) {
    console.log('POST /api/v1/arq/tasks/submit - body:', body);
    
    const { type, data, goal, description, taskType } = body;
    
    // Create task in database
    const task = await this.tasksService.create({
      type: taskType || type || 'feature',
      goal: goal || data?.goal || '',
      description: description || data?.description || '',
      tags: data?.tags || [],
      status: 'pending'
    });
    
    console.log('Created task in database:', task.id);
    
    res.status(201).json({
      taskId: task.id,
      status: 'accepted',
      message: 'Task submitted successfully'
    });
  }

  @Get('tasks')
  async getTasks() {
    console.log('GET /api/v1/arq/tasks - Returning tasks from database');
    return await this.tasksService.findAll();
  }

  @Get('tasks/:id')
  async getTask(@Param('id') id: string) {
    return await this.tasksService.findOne(id);
  }
}
