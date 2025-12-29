import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { DevelopmentTaskEntity } from '../../entities/development-task.entity';

@Injectable()
export class TaskRepository extends Repository<DevelopmentTaskEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(
      DevelopmentTaskEntity,
      dataSource.createEntityManager(),
    );
  }

  async findAllTasks() {
    return this.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findTaskById(taskId: string) {
    return this.findOne({
      where: { id: taskId },
    });
  }

  async createTask(taskData: Partial<DevelopmentTaskEntity>) {
    const task = this.create(taskData);
    return this.save(task);
  }

  async updateTask(taskId: string, updateData: Partial<DevelopmentTaskEntity>) {
    await this.update(taskId, updateData);
    return this.findTaskById(taskId);
  }

  async deleteTask(taskId: string) {
    return this.delete(taskId);
  }
}
