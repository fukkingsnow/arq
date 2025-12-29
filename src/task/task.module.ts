import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevelopmentTaskEntity } from '../entities/development-task.entity';
import { TaskRepository } from './repositories/task.repository';
import { TaskService } from './services/task.service';
import { TaskController } from './controllers/task.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DevelopmentTaskEntity])],
  controllers: [TaskController],
  providers: [TaskService, TaskRepository],
  exports: [TaskService],
})
export class TaskModule {}
