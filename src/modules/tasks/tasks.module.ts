import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TasksProcessor } from './tasks.processor';
import { FileSystemService } from '../../services/file-system.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'task-queue',
    }),
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksProcessor, FileSystemService],
  exports: [TasksService],
})
export class TasksModule {}
