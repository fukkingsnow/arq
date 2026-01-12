import { Controller, Post, Get, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TASKS_FILE = join(process.cwd(), 'data', 'tasks.json');

export class SubmitTaskDto {
  type: string;
  data: any;
}

@Controller('api/tasks')
export class TaskController {
  private tasks: any[] = [];

  constructor() {
    this.loadTasks();
  }

  private loadTasks() {
    try {
      if (existsSync(TASKS_FILE)) {
        const content = readFileSync(TASKS_FILE, 'utf8');
        this.tasks = JSON.parse(content);
      } else {
        this.tasks = [];
        this.saveTasks();
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
      this.tasks = [];
    }
  }

  private saveTasks() {
    try {
      writeFileSync(TASKS_FILE, JSON.stringify(this.tasks, null, 2));
    } catch (err) {
      console.error('Error saving tasks:', err);
    }
  }

  @Post('submit')
  @HttpCode(HttpStatus.ACCEPTED)
  async submitTask(@Body() dto: SubmitTaskDto) {
    const taskId = `task_${Date.now()}`;
    const task = {
      id: taskId,
      ...dto,
      status: 'active',
      createdAt: new Date().toISOString(),
      logs: [
        {
          timestamp: new Date().toISOString(),
          message: 'Task initialized',
          level: 'info'
        },
        {
          timestamp: new Date().toISOString(),
          message: 'Execution started',
          level: 'info'
        },
        {
          timestamp: new Date().toISOString(),
          message: `Processing... (estimated time: 2h)`,
          level: 'warning'
        }
      ]
    };

    this.tasks.push(task);
    this.saveTasks();

    return {
      taskId,
      status: 'accepted',
      message: 'Task submitted successfully'
    };
  }

  @Get()
  async getAllTasks() {
    this.loadTasks();
    return this.tasks;
  }

  @Get('status/:taskId')
  async getTaskStatus(@Param('taskId') taskId: string) {
    this.loadTasks();
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      return {
        taskId,
        status: task.status,
        data: task.data,
        logs: task.logs
      };
    }
    return {
      taskId,
      status: 'not_found',
      message: 'Task not found'
    };
  }
}
