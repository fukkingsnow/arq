import {
  Controller,
  Post,
  Get,
  Put,
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

  @Post('complete/:taskId')
  @HttpCode(HttpStatus.OK)
  async completeTask(@Param('taskId') taskId: string, @Body() body: any) {
    const result = await this.taskConsumerService.completeTask(taskId, body);
    
    return {
      taskId,
      status: 'completed',
      message: 'Task marked as completed',
      result
    };
  }

  @Put('status/:taskId')
  async updateTaskStatus(@Param('taskId') taskId: string, @Body() body: { status: string; progress?: number; data?: any }) {
    const updated = await this.taskConsumerService.updateTaskStatus(taskId, body.status, body.progress, body.data);
    return {
      taskId,
      status: body.status,
      message: 'Task status updated',
      updated
    };
  }
}
