metrics.service.tsimport { Injectable } from '@nestjs/common';

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  inProgressTasks: number;
  averageExecutionTime: number;
  successRate: number;
  timestamp: Date;
}

export interface ProcessingStats {
  hourly: { [key: string]: number };
  daily: { [key: string]: number };
  totalProcessed: number;
  peakHour: string;
}

@Injectable()
export class MetricsService {
  private metrics: Map<string, any> = new Map();
  private taskHistory: Array<any> = [];

  /**
   * Record task execution
   */
  recordTaskExecution(taskId: string, duration: number, status: 'success' | 'failed') {
    this.taskHistory.push({
      taskId,
      duration,
      status,
      timestamp: new Date(),
    });
    this.updateMetrics();
  }

  /**
   * Get current metrics
   */
  getMetrics(): TaskMetrics {
    const stats = this.calculateStats();
    return {
      totalTasks: stats.total,
      completedTasks: stats.completed,
      failedTasks: stats.failed,
      inProgressTasks: stats.inProgress,
      averageExecutionTime: stats.avgTime,
      successRate: stats.successRate,
      timestamp: new Date(),
    };
  }

  /**
   * Get processing statistics by time
   */
  getProcessingStats(): ProcessingStats {
    const hourly: { [key: string]: number } = {};
    const daily: { [key: string]: number } = {};

    this.taskHistory.forEach(({ timestamp, status }) => {
      if (status === 'success') {
        const hour = new Date(timestamp).getHours().toString();
        const day = new Date(timestamp).toLocaleDateString();
        hourly[hour] = (hourly[hour] || 0) + 1;
        daily[day] = (daily[day] || 0) + 1;
      }
    });

    const peakHour = Object.entries(hourly).reduce((a, b) =>
      a[1] > b[1] ? a : b,
      ['0', 0],
    )[0];

    return {
      hourly,
      daily,
      totalProcessed: this.taskHistory.length,
      peakHour,
    };
  }

  /**
   * Get metrics for dashboard visualization
   */
  getDashboardMetrics() {
    const metrics = this.getMetrics();
    const stats = this.getProcessingStats();
    const history = this.getTaskHistory();

    return {
      overview: metrics,
      statistics: stats,
      recentTasks: history.slice(-10),
      charts: {
        successRate: this.getSuccessRateChart(),
        executionTime: this.getExecutionTimeChart(),
        hourlyProcessing: stats.hourly,
        dailyProcessing: stats.daily,
      },
    };
  }

  /**
   * Get task history
   */
  getTaskHistory(limit: number = 50) {
    return this.taskHistory.slice(-limit);
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(daysToKeep: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    this.taskHistory = this.taskHistory.filter(
      (task) => new Date(task.timestamp) > cutoffDate,
    );
  }

  private calculateStats() {
    const total = this.taskHistory.length;
    const completed = this.taskHistory.filter((t) => t.status === 'success').length;
    const failed = total - completed;
    const inProgress = 0;
    const avgTime =
      total > 0
        ? this.taskHistory.reduce((sum, t) => sum + t.duration, 0) / total
        : 0;
    const successRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      failed,
      inProgress,
      avgTime: Math.round(avgTime),
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  private updateMetrics() {
    this.metrics.set('lastUpdate', new Date());
  }

  private getSuccessRateChart() {
    const stats = this.calculateStats();
    return [
      {
        name: 'Success',
        value: stats.completed,
        percentage: stats.successRate,
      },
      {
        name: 'Failed',
        value: stats.failed,
        percentage: 100 - stats.successRate,
      },
    ];
  }

  private getExecutionTimeChart() {
    const times = this.taskHistory.map((t) => t.duration);
    const min = Math.min(...times);
    const max = Math.max(...times);
    const avg = this.calculateStats().avgTime;

    return {
      min,
      max,
      average: avg,
      median: this.getMedian(times),
    };
  }

  private getMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
  }
}
