import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
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

  /**
   * RECORD TASK EXECUTION
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
   * NEW: АНАЛИЗ ЦЕЛОСТНОСТИ СИСТЕМЫ (ИНТРОСПЕКЦИЯ)
   * Проверяет соответствие префикса в NestJS и вызовов во фронтенде
   */
  async checkInternalIntegrity() {
    try {
      const rootPath = '/opt/arq/src';
      
      // 1. Извлекаем префикс из main.ts
      const mainTsPath = join(rootPath, 'main.ts');
      const mainTsContent = readFileSync(mainTsPath, 'utf8');
      const prefixMatch = mainTsContent.match(/setGlobalPrefix\(['"](.+?)['"]\)/);
      const backendPrefix = prefixMatch ? prefixMatch[1] : '';

      // 2. Ищем вызовы API в index.html фронтенда
      const indexHtmlPath = join(rootPath, 'frontend/dist/index.html');
      const indexHtmlContent = readFileSync(indexHtmlPath, 'utf8');
      
      // Проверяем, содержат ли fetch-запросы актуальный префикс
      const hasCorrectPrefix = indexHtmlContent.includes(`fetch('/${backendPrefix}`);

      return {
        backendPrefix,
        frontendSynced: hasCorrectPrefix,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error(`Integrity check failed: ${error.message}`);
      return { 
        backendPrefix: 'unknown', 
        frontendSynced: false, 
        error: error.message 
      };
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

  getDashboardMetrics() {
    const metrics = this.getMetrics();
    const stats = this.getProcessingStats();
    return {
      overview:
