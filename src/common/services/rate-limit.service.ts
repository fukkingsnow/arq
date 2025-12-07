import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RateLimitEntry {
  timestamp: number;
  count: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: any) => string; // Function to generate rate limit key
}

@Injectable()
export class RateLimitService {
  private readonly defaultConfig: RateLimitConfig;
  private limiters: Map<string, RateLimitEntry[]> = new Map();
  private readonly cleanupInterval: NodeJS.Timeout;
  private readonly cleanupThreshold: number = 3600000; // 1 hour

  constructor(private configService: ConfigService) {
    this.defaultConfig = {
      windowMs: 60000, // 1 minute default
      maxRequests: 100, // 100 requests per minute
      keyGenerator: (req: any) => req.ip || 'unknown'
    };

    // Cleanup stale entries every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleEntries();
    }, 600000);
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupInterval);
  }

  /**
   * Check if request is within rate limit
   */
  isAllowed(key: string, config?: Partial<RateLimitConfig>): boolean {
    const finalConfig = { ...this.defaultConfig, ...config };
    const now = Date.now();
    
    if (!this.limiters.has(key)) {
      this.limiters.set(key, []);
    }

    const entries = this.limiters.get(key) || [];
    
    // Remove entries outside the time window
    const validEntries = entries.filter(
      entry => now - entry.timestamp < finalConfig.windowMs
    );

    // Check if limit is exceeded
    if (validEntries.length >= finalConfig.maxRequests) {
      return false;
    }

    // Add new entry
    validEntries.push({ timestamp: now, count: 1 });
    this.limiters.set(key, validEntries);

    return true;
  }

  /**
   * Get current request count for a key
   */
  getRequestCount(key: string, windowMs?: number): number {
    const now = Date.now();
    const window = windowMs || this.defaultConfig.windowMs;
    const entries = this.limiters.get(key) || [];
    
    return entries.filter(
      entry => now - entry.timestamp < window
    ).length;
  }

  /**
   * Get remaining requests until rate limit
   */
  getRemainingRequests(
    key: string,
    config?: Partial<RateLimitConfig>
  ): number {
    const finalConfig = { ...this.defaultConfig, ...config };
    const current = this.getRequestCount(key, finalConfig.windowMs);
    return Math.max(0, finalConfig.maxRequests - current);
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.limiters.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.limiters.clear();
  }

  /**
   * Get time until next available request
   */
  getResetTime(key: string, windowMs?: number): number {
    const now = Date.now();
    const window = windowMs || this.defaultConfig.windowMs;
    const entries = this.limiters.get(key) || [];
    
    if (entries.length === 0) {
      return 0;
    }

    const oldestEntry = entries[0];
    const resetTime = oldestEntry.timestamp + window - now;
    
    return Math.max(0, resetTime);
  }

  /**
   * Create a sliding window rate limiter
   */
  createSlidingWindowLimiter(
    maxRequests: number,
    windowMs: number
  ): (key: string) => boolean {
    return (key: string) => {
      return this.isAllowed(key, { maxRequests, windowMs });
    };
  }

  /**
   * Create a fixed window rate limiter
   */
  createFixedWindowLimiter(
    maxRequests: number,
    windowMs: number
  ): (key: string) => boolean {
    const windows = new Map<string, { count: number; resetTime: number }>();

    return (key: string) => {
      const now = Date.now();
      const window = windows.get(key);

      if (!window || now >= window.resetTime) {
        windows.set(key, { count: 1, resetTime: now + windowMs });
        return true;
      }

      if (window.count >= maxRequests) {
        return false;
      }

      window.count++;
      return true;
    };
  }

  /**
   * Get rate limit statistics
   */
  getStatistics(): { totalKeys: number; totalRequests: number } {
    let totalRequests = 0;
    
    this.limiters.forEach(entries => {
      totalRequests += entries.length;
    });

    return {
      totalKeys: this.limiters.size,
      totalRequests
    };
  }

  /**
   * Cleanup stale entries older than threshold
   */
  private cleanupStaleEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.limiters.forEach((entries, key) => {
      const validEntries = entries.filter(
        entry => now - entry.timestamp < this.cleanupThreshold
      );

      if (validEntries.length === 0) {
        keysToDelete.push(key);
      } else if (validEntries.length < entries.length) {
        this.limiters.set(key, validEntries);
      }
    });

    keysToDelete.forEach(key => this.limiters.delete(key));
  }

  /**
   * Export current state for persistence
   */
  exportState(): Record<string, RateLimitEntry[]> {
    const state: Record<string, RateLimitEntry[]> = {};
    
    this.limiters.forEach((entries, key) => {
      state[key] = [...entries];
    });

    return state;
  }

  /**
   * Import state from persistence
   */
  importState(state: Record<string, RateLimitEntry[]>): void {
    this.limiters.clear();
    
    Object.entries(state).forEach(([key, entries]) => {
      this.limiters.set(key, [...entries]);
    });
  }
}

