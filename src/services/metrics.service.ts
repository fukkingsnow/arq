import { Injectable, Logger } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private taskHistory: Array<any> = [];

  async checkInternalIntegrity() {
    try {
      // В контейнере используем /app, на хосте /opt/arq
      const rootPath = process.cwd(); 
      const mainTsPath = join(rootPath, 'src/main.ts');
      const frontendPath = join(rootPath, 'src/frontend/index.html');

      let backendPrefix = 'api/v1';
      if (existsSync(mainTsPath)) {
        const mainTsContent = readFileSync(mainTsPath, 'utf8');
        const prefixMatch = mainTsContent.match(/setGlobalPrefix\(['"](.+?)['"]\)/);
        backendPrefix = prefixMatch ? prefixMatch[1] : 'api/v1';
      }

      // Проверяем реальное наличие фронтенда
      const isSynced = existsSync(frontendPath);
      
      if (!isSynced) {
        this.logger.error(`[METRICS] Frontend not found at ${frontendPath}`);
      }

      return {
        backendPrefix: backendPrefix,
        frontendSynced: isSynced,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error(`Integrity check failed: ${error.message}`);
      return { backendPrefix: 'error', frontendSynced: false };
    }
  }

  getDashboardMetrics() {
    return {
      overview: { totalTasks: this.taskHistory.length, successRate: 100 },
      timestamp: new Date(),
    };
  }
}
