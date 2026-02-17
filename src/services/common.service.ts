import { Injectable } from '@nestjs/common';

/**
 * Common Service
 * Provides shared utility methods and common operations across the application
 */
@Injectable()
export class CommonService {
  /**
   * Generate a unique ID
   */
  generateUniqueId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if a value is empty
   */
  isEmpty(value: any): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === 'string' && value.trim().length === 0) {
      return true;
    }
    if (Array.isArray(value) && value.length === 0) {
      return true;
    }
    if (typeof value === 'object' && Object.keys(value).length === 0) {
      return true;
    }
    return false;
  }

  /**
   * Format date to ISO string
   */
  formatDate(date: Date): string {
    return date.toISOString();
  }

  /**
   * Parse query string to object
   */
  parseQueryString(query: string): Record<string, string> {
    const params = new URLSearchParams(query);
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Deep clone an object
   */
  deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}
