import { Injectable } from '@nestjs/common';

@Injectable()
export class StatusQueryService {
  async getTaskStatus(taskId: string) {
    return {
      taskId,
      status: 'in_progress',
      progress: 65,
      completionTime: '2 hours 30 minutes',
      metrics: {
        tasksCompleted: 8,
        totalTasks: 12,
        errorCount: 1,
        lastUpdated: new Date(),
      },
    };
  }
}
