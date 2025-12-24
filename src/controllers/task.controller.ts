import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { TaskConsumerService, TaskPayload } from '../queue';

export class SubmitTaskDto {
  type: string;
  data: any;
  priority?: number;
  retries?: number;
}

@Controller('api/tasks')
export class TaskController {
  constructor(private taskConsumerService: TaskConsumerService) {}

  @Post('submit')
  @HttpCode(HttpStatus.ACCEPTED)
  async submitTask(@Body() dto: SubmitTaskDto) {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const payload: TaskPayload = {
      taskId,
      type: dto.type,
      data: dto.data,
      priority: dto.priority,
      retries: dto.retries,
    };

    const jobId = await this.taskConsumerService.submitTask(payload);
    
    return {
      taskId,
      jobId,
      status: 'submitted',
      message: 'Task submitted successfully to queue',
    };
  }

  @Get('status/:taskId')
  async getTaskStatus(@Param('taskId') taskId: string) {
    const status = await this.taskConsumerService.getTaskStatus(taskId);
    
    if (!status) {
      return {
        taskId,
        status: 'not_found',
        message: 'Task not found in queue',
      };
    }

    return {
      taskId,
      status: status.state,
      progress: status.progress,
      data: status.data,
    };
  }
}
