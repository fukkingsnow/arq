import { Controller, Post, Get, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';

export class SubmitTaskDto {
  type: string;
  data: any;
}

@Controller('api/tasks')
export class TaskController {
  @Post('submit')
  @HttpCode(HttpStatus.ACCEPTED)
  async submitTask(@Body() dto: SubmitTaskDto) {
    const taskId = `task_${Date.now()}`;
    return {
      taskId,
      status: 'submitted',
      message: 'Task submitted successfully',
    };
  }

  @Get('status/:taskId')
  async getTaskStatus(@Param('taskId') taskId: string) {
    return {
      taskId,
      status: 'pending',
      message: 'Task status check',
    };
  }
}
