import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkflowRepository } from './workflow.repository';
import { Workflow } from '../entities/workflow.entity';
import { CreateWorkflowDto, UpdateWorkflowDto } from '../dto/workflow.dto';@Injectable()
export class WorkflowService {
  constructor(private readonly workflowRepository: WorkflowRepository) {}

  async createWorkflow(userId: string, createWorkflowDto: CreateWorkflowDto): Promise<Workflow> {
    try {
      return await this.workflowRepository.create({
        ...createWorkflowDto,
        userId,
        status: 'draft',
      });
    } catch (error) {
      throw new BadRequestException('Failed to create workflow: ' + error.message);
    }
  }

  async getWorkflow(id: string): Promise<Workflow> {
    const workflow = await this.workflowRepository.findById(id);
    if (!workflow) {
      throw new NotFoundException(`Workflow ${id} not found`);
    }
    return workflow;
  }

  async getUserWorkflows(userId: string): Promise<Workflow[]> {
    return this.workflowRepository.findByUserId(userId);
  }

  async getActiveWorkflows(): Promise<Workflow[]> {
    return this.workflowRepository.findActive();
  }

  async updateWorkflow(id: string, updateWorkflowDto: UpdateWorkflowDto): Promise<Workflow> {
    const workflow = await this.getWorkflow(id);
    try {
      return await this.workflowRepository.update(id, updateWorkflowDto);
    } catch (error) {
      throw new BadRequestException('Failed to update workflow: ' + error.message);
    }
  }

  async publishWorkflow(id: string): Promise<Workflow> {
    const workflow = await this.getWorkflow(id);
    if (workflow.status !== 'draft') {
      throw new BadRequestException('Only draft workflows can be published');
    }
    return this.workflowRepository.update(id, { status: 'active' });
  }

  async pauseWorkflow(id: string): Promise<Workflow> {
    return this.workflowRepository.update(id, { status: 'paused' });
  }

  async archiveWorkflow(id: string): Promise<Workflow> {
    return this.workflowRepository.update(id, { status: 'archived' });
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    const workflow = await this.getWorkflow(id);
    return this.workflowRepository.delete(id);
  }

  async getWorkflowsByStatus(status: 'draft' | 'active' | 'paused' | 'archived'): Promise<Workflow[]> {    return this.workflowRepository.findByStatus(status);
  }

  async updateWorkflowSteps(id: string, steps: any[]): Promise<Workflow> {
    const workflow = await this.getWorkflow(id);
    return this.workflowRepository.update(id, { steps });
  }
}
