import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from '../entities/workflow.entity';
import { WorkflowRepository } from '../services/workflow.repository';
import { WorkflowService } from '../services/workflow.service';

@Module({
  imports: [TypeOrmModule.forFeature([Workflow])],
  providers: [WorkflowRepository, WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
