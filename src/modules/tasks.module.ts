import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { TasksService } from './tasks.service';
import { TaskExecutorService } from './task-executor.service';
import { TaskController } from '../controllers/task.controller';
import { TaskRepository } from '../repositories/task-repository';
@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  providers: [TasksService, TaskExecutorService, TaskRepository], controllers: [TaskController],
  })
export class TasksModule {}
