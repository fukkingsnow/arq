import { Injectable, Logger } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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
  private readonly logger = new Logger(MetricsService.name);
  private metrics: Map<string, any> = new Map();
  private taskHistory: Array<any> = [];

  recordTaskExecution(taskId: string, duration: number, status: 'success' | 'failed') {
    this.taskHistory.push({ taskId, duration, status, timestamp: new Date() });
    this.updateMetrics();
  }

  /**
   * ПРОВЕРКА ЦЕЛОСТНОСТИ СИСТЕМЫ
   * ИМИТАЦИЯ ПОЛОМКИ ДЛЯ ТЕСТА АВТОНОМНОСТИ
   */
  async checkInternalIntegrity() {
    try {
      const rootPath = existsSync('/opt/arq/src') ? '/opt/arq/src' : process.cwd();
      const mainTsPath = join(rootPath, 'main.ts');
      
      let backendPrefix = 'api/v1'; 

      if (existsSync(mainTsPath)) {
        const mainTsContent = readFileSync(mainTsPath, 'utf8');
        const prefixMatch = mainTsContent.match(/setGlobalPrefix\(['"](.+?)['"]\)/);
        backendPrefix = prefixMatch ? prefixMatch[1] : 'api/v1';
      }

      this.logger.warn('[ARQ-TEST] Simulating integrity failure...');
      
      return { 
        backendPrefix: backendPrefix, 
        frontendSynced: false, // ТРИГГЕР ПОЛОМКИ
        timestamp: new Date() 
      };

    } catch (error) {
      this.logger.error(`Integrity check failed: ${error.message}`);
      return { backendPrefix: 'error', frontendSynced: false };
    }
  }

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
    return {
      hourly,
      daily,
      totalProcessed: this.taskHistory.length,
      peakHour: Object.entries(hourly).reduce((a, b) => a[1] > b[1] ? a : b, ['0', 0])[0],
    };
  }

  getDashboardMetrics() {
    const metrics = this.getMetrics();
    const stats = this.getProcessingStats();
    return {
      overview: metrics,
      statistics: stats,
      recentTasks: this.taskHistory.slice(-10),
    };
  }

  private calculateStats() {
    const total = this.taskHistory.length;
    const completed = this.taskHistory.filter((t) => t.status === 'success').length;
    const avgTime = total > 0 ? this.taskHistory.reduce((sum, t) => sum + t.duration, 0) / total : 0;
    return {
      total,
      completed,
      failed: total - completed,
      inProgress: 0,
      avgTime: Math.round(avgTime),
      successRate: total > 0 ? Math.round((completed / total) * 10000) / 100 : 0,
    };
  }

  private updateMetrics() { 
    this.metrics.set('lastUpdate', new Date()); 
  }
}
