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
        console.log('[TaskController] Received body:', JSON.stringify(body, null, 2));
    
    // Create task in database
    const task = await this.tasksService.create({
      // Support both frontend format (title, description, priority) and legacy format (goal, data.goal)
      type: body.type || body.taskType || 'feature',
      title: body.title || body.goal || body.data?.goal || 'Untitled Task',
      description: body.description || body.data?.description || '',
      priority: body.priority || 'medium',
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
