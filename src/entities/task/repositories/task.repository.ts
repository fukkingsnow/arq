import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { DevelopmentTaskEntity } from '../../development-task.entity';@Injectable()
export class TaskRepository extends Repository<DevelopmentTaskEntity> {
  constructor(private dataSource: DataSource) {
    super(DevelopmentTaskEntity, dataSource.createEntityManager());
  }

  async createTask(taskData: Partial<DevelopmentTaskEntity>): Promise<DevelopmentTaskEntity> {
    const task = this.create(taskData);
    return this.save(task);
  }

  async updateTaskStatus(
    taskId: string,
    status: string,
    progress?: number,
  ): Promise<DevelopmentTaskEntity> {
    await this.update(taskId, { status, progress });
    return this.findOneBy({ id: taskId });
  }

  async getActiveTaskCount(): Promise<number> {
    return this.countBy({ status: 'ACTIVE' });
  }

  async getTasksByStatus(status: string): Promise<DevelopmentTaskEntity[]> {
    return this.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  async getTasksByType(taskType: string): Promise<DevelopmentTaskEntity[]> {
    return this.find({
      where: { taskType },
      order: { createdAt: 'DESC' },
    });
  }

  async getCompletedTasksCount(): Promise<number> {
    return this.countBy({ status: 'COMPLETED' });
  }

  async getTaskMetrics(): Promise<{
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    successRate: number;
  }> {
    const totalTasks = await this.count();
    const activeTasks = await this.countBy({ status: 'ACTIVE' });
    const completedTasks = await this.countBy({ status: 'COMPLETED' });
    const successfulTasks = await this.countBy({ status: 'COMPLETED', metrics: { success: true } as any });
    
    return {
      totalTasks,
      activeTasks,
      completedTasks,
      successRate: totalTasks > 0 ? (successfulTasks / totalTasks) * 100 : 0,
    };
  }

  async deleteOldTasks(daysOld: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    await this.delete({
      createdAt: { $lt: cutoffDate } as any,
    });
  }
}
