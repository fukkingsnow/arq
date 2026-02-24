import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from '../../entities/task.entity';
import { OrchestratorService } from '../orchestrator.service';
import { ServicesController } from '../services.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  controllers: [TasksController, ServicesController],
  providers: [TasksService, OrchestratorService],
  exports: [TasksService, OrchestratorService],
})
export class TasksModule {}
