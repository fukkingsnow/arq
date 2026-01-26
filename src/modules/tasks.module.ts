import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { TasksService } from './tasks.service';
import { TaskController } from '../controllers/task.controller';
import { TaskRepository } from '../repositories/task-repository';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  providers: [TasksService, TaskRepository],
  controllers: [TaskController],
  exports: [TasksService]
})
export class TasksModule {}
