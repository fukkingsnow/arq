import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from '../entities/task.entity';

// Путь изменен на 'api/v1', чтобы соответствовать запросам фронтенда
@Controller('api/v1')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  /**
   * Эндпоинт для проверки статуса системы.
   * Именно сюда стучится фронтенд, чтобы зажечь зеленую точку.
   */
  @Get('health')
  healthCheck() {
    return { 
      status: 'ok', 
      service: 'arq-api',
      timestamp: new Date().toISOString() 
    };
  }

  /**
   * Работа с задачами
   * Доступно по адресу: POST /api/v1/tasks/submit
   */
  @Post('tasks/submit')
  async create(@Body() data: any): Promise<Task> {
    return this.tasksService.create(data);
  }

  /**
   * Получение списка всех задач
   * Доступно по адресу: GET /api/v1/tasks
   */
  @Get('tasks')
  async findAll(): Promise<Task[]> {
    return this.tasksService.findAll();
  }

  /**
   * Получение одной задачи по ID
   */
  @Get('tasks/:id')
  async findOne(@Param('id') id: string): Promise<Task> {
    return this.tasksService.findOne(id);
  }

  /**
   * Обновление задачи
   */
  @Put('tasks/:id')
  async update(
    @Param('id') id: string,
    @Body() data: any,
  ): Promise<Task> {
    return this.tasksService.update(id, data);
  }

  /**
   * Удаление задачи
   */
  @Delete('tasks/:id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.tasksService.remove(id);
  }
}
