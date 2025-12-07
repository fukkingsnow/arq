import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
  hits: number;
}

@Injectable()
export class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly cleanupInterval: NodeJS.Timeout;
  private readonly defaultTTL: number = 3600000; // 1 hour default
  private stats = { hits: 0, misses: 0 };

  constructor() {
    // Auto cleanup of expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.removeExpiredEntries();
    }, 300000);
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupInterval);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update hit count and timestamp
    entry.hits++;
    entry.timestamp = Date.now();
    this.stats.hits++;

    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0
    });
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache value or compute if missing
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached) {
      return cached;
    }

    const value = await computeFn();
    this.set(key, value, ttl);

    return value;
  }

  /**
   * Get size of cache (number of entries)
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys in cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total === 0 ? 0 : this.stats.hits / total
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Get entry metadata
   */
  getEntryMetadata(
    key: string
  ): { age: number; hits: number; ttl?: number } | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    return {
      age: Date.now() - entry.timestamp,
      hits: entry.hits,
      ttl: entry.ttl
    };
  }

  /**
   * Get most accessed keys
   */
  getTopKeys(limit: number = 10): Array<{ key: string; hits: number }> {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, hits: entry.hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);
  }

  /**
   * Remove entries older than specified age
   */
  removeOlderThan(ageMs: number): number {
    const now = Date.now();
    let removed = 0;

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > ageMs) {
        this.cache.delete(key);
        removed++;
      }
    });

    return removed;
  }

  /**
   * Remove expired entries
   */
  private removeExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Batch set multiple values
   */
  mset(entries: Map<string, any>, ttl?: number): void {
    entries.forEach((value, key) => {
      this.set(key, value, ttl);
    });
  }

  /**
   * Batch get multiple values
   */
  mget<T>(keys: string[]): Map<string, T | null> {
    const result = new Map<string, T | null>();

    keys.forEach(key => {
      result.set(key, this.get<T>(key));
    });

    return result;
  }

  /**
   * Batch delete multiple keys
   */
  mdelete(keys: string[]): number {
    let deleted = 0;

    keys.forEach(key => {
      if (this.cache.delete(key)) {
        deleted++;
      }
    });

    return deleted;
  }

  /**
   * Export cache state
   */
  exportState(): Record<string, any> {
    const state: Record<string, any> = {};

    this.cache.forEach((entry, key) => {
      state[key] = entry.value;
    });

    return state;
  }

  /**
   * Import cache state
   */
  importState(state: Record<string, any>, ttl?: number): void {
    Object.entries(state).forEach(([key, value]) => {
      this.set(key, value, ttl);
    });
  }
}

