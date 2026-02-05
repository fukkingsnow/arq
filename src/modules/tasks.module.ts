import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { TasksService } from './tasks.service';
import { TaskExecutorService } from './task-executor.service';
import { TaskController } from '../controllers/task.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
providers: [TasksService, TaskExecutorService],  controllers: [TaskController],
})
export class TasksModule {}
