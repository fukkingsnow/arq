import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TaskService } from '../services/task.service';
import { DevelopmentTaskEntity } from '../../entities/development-task.entity';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTask(@Body() taskData: Partial<DevelopmentTaskEntity>) {
    return this.taskService.createTask(taskData);
  }

  @Get()
  async getAllTasks() {
    return [];
  }

  @Get('metrics')
  async getMetrics() {
    return {};
  }

  @Get('active')
  async getActiveTasks() {
    return this.taskService.getTaskByStatus('PENDING');
  }

  @Get('status/:status')
  async getTasksByStatus(@Param('status') status: string) {
    return this.taskService.getTaskByStatus(status);
  }

  @Get(':id')
  async getTask(@Param('id') id: string) {
    return this.taskService.getTask(id);
  }
}
