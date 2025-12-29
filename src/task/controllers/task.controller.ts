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
  constructor(private taskService: TaskService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTask(@Body() taskData: Partial<DevelopmentTaskEntity>) {
    return this.taskService.createTask(taskData);
  }

  @Get()
  async getAllTasks() {
    return this.taskService.getAllTasks();
  }

  @Get('metrics')
  async getMetrics() {
    return this.taskService.getTaskMetrics();
  }

  @Get('active')
  async getActiveTasks() {
    return this.taskService.getActiveTasks();
  }

  @Get('status/:status')
  async getTasksByStatus(@Param('status') status: string) {
    return this.taskService.getTasksByStatus(status);
  }

  @Get(':id')
  async getTask(@Param('id') id: string) {
    return this.taskService.getTask(id);
  }

  @Post(':id/progress')
  async updateProgress(
    @Param('id') id: string,
    @Body('progress') progress: number,
  ) {
    return this.taskService.updateTaskProgress(id, progress);
  }

  @Post(':id/complete')
  async completeTask(
    @Param('id') id: string,
    @Body('result') result: any,
  ) {
    return this.taskService.completeTask(id, result);
  }

  @Post(':id/fail')
  async failTask(
    @Param('id') id: string,
    @Body('error') error: string,
  ) {
    return this.taskService.failTask(id, error);
  }

  @Post('cleanup')
  async cleanupTasks(@Query('daysOld') daysOld: number = 30) {
    await this.taskService.deleteCompletedTasks(daysOld);
    return { message: 'Cleanup completed' };
  }
}
