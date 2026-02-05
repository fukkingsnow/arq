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
      // 1. Пытаемся считать реальные данные (как и раньше)
      const rootPath = existsSync('/opt/arq/src') ? '/opt/arq/src' : process.cwd();
      const mainTsPath = join(rootPath, 'main.ts');
      
      let backendPrefix = 'api/v1'; // Значение по умолчанию

      if (existsSync(mainTsPath)) {
        const mainTsContent = readFileSync(mainTsPath, 'utf8');
        const prefixMatch = mainTsContent.match(/setGlobalPrefix\(['"](.+?)['"]\)/);
        backendPrefix = prefixMatch ? prefixMatch[1] : 'api/v1';
      }

      // ---------------------------------------------------------
      // 🚨 ТРИГГЕР ПОЛОМКИ: Мы специально говорим, что фронтенд НЕ СИНХРОНИЗИРОВАН.
      // Это заставит AutonomousStrategyAnalyzer запустить процедуру исправления.
      // ---------------------------------------------------------
      this.logger.warn('[ARQ-TEST] Simulating integrity failure...');
      
      return { 
        backendPrefix: backendPrefix, 
        frontendSynced: false, // <-- ЗДЕСЬ МЫ ЛОМАЕМ
        timestamp: new Date() 
      };
      // ---------------------------------------------------------

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
      in
