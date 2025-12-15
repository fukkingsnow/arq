import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workflow } from '../entities/workflow.entity';

@Injectable()
export class WorkflowRepository {
  constructor(
    @InjectRepository(Workflow)
    private readonly repository: Repository<Workflow>,
  ) {}

  async create(data: Partial<Workflow>): Promise<Workflow> {
    const workflow = this.repository.create(data);
    return this.repository.save(workflow);
  }

  async findById(id: string): Promise<Workflow | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Workflow[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<Workflow[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, data: Partial<Workflow>): Promise<Workflow | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }

  async findByStatus(status: 'draft' | 'active' | 'paused' | 'archived'): Promise<Workflow[]> {    return this.repository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<Workflow[]> {
    return this.repository.find({
      where: { status: 'active' },
      order: { createdAt: 'DESC' },
    });
  }
}
