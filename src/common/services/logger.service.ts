import { Injectable, LogLevel, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  error?: string;
  stack?: string;
}

@Injectable()
export class LoggerService extends Logger {
  private logFilePath: string;
  private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private readonly maxBackups: number = 5;
  private readonly logDir: string;
  private isDevelopment: boolean;

  constructor(private configService: ConfigService) {
    super();
    this.isDevelopment = this.configService.get('NODE_ENV') === 'development';
    this.logDir = this.configService.get('LOG_DIR') || 'logs';
    this.ensureLogDirectory();
    this.logFilePath = path.join(this.logDir, 'application.log');
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatLogEntry(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  private writeToFile(entry: LogEntry): void {
    try {
      const logLine = this.formatLogEntry(entry) + '\n';
      
      if (this.isFileSizeExceeded()) {
        this.rotateLogFile();
      }

      fs.appendFileSync(this.logFilePath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private isFileSizeExceeded(): boolean {
    try {
      const stats = fs.statSync(this.logFilePath);
      return stats.size > this.maxFileSize;
    } catch {
      return false;
    }
  }

  private rotateLogFile(): void {
    try {
      const timestamp = this.getTimestamp().replace(/[:.]/g, '-');
      const backupPath = path.join(
        this.logDir,
        `application.log.${timestamp}`
      );
      fs.renameSync(this.logFilePath, backupPath);
      this.cleanupOldBackups();
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  private cleanupOldBackups(): void {
    try {
      const files = fs.readdirSync(this.logDir);
      const backups = files
        .filter(f => f.startsWith('application.log.'))
        .sort()
        .reverse();

      if (backups.length > this.maxBackups) {
        backups.slice(this.maxBackups).forEach(backup => {
          fs.unlinkSync(path.join(this.logDir, backup));
        });
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  log(message: string, context?: string): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: 'log',
      context: (context || this.context) as string,
      message
    };

    this.writeToFile(entry);
    if (this.isDevelopment) {
      super.log(message, context);
    }
  }

  error(message: string, trace?: string, context?: string): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: 'error',
      context: (context || this.context) as string,
      message,
      stack: trace
    };

    this.writeToFile(entry);
    if (this.isDevelopment) {
      super.error(message, trace, context);
    }
  }

  warn(message: string, context?: string): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: 'warn',
      context: (context || this.context) as string,
      message
    };

    this.writeToFile(entry);
    if (this.isDevelopment) {
      super.warn(message, context);
    }
  }

  debug(message: string, context?: string): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: 'debug',
      context: (context || this.context) as string,
      message
    };

    this.writeToFile(entry);
    if (this.isDevelopment) {
      super.debug(message, context);
    }
  }

  verbose(message: string, context?: string): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: 'verbose',
      context: (context || this.context) as string,
      message
    };

    this.writeToFile(entry);
    if (this.isDevelopment) {
      super.verbose(message, context);
    }
  }

  logWithData(message: string, data: any, context?: string): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: 'log',
      context: (context || this.context) as string,
      message,
      data: this.sanitizeData(data)
    };

    this.writeToFile(entry);
    if (this.isDevelopment) {
      super.log(`${message} ${JSON.stringify(data)}`, context);
    }
  }

  private sanitizeData(data: any): any {
    const sensitive = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };
    Object.keys(sanitized).forEach(key => {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}

