import { Injectable } from '@nestjs/common';

/**
 * Cache entry metadata.
 */
export interface ICacheEntry<T> {
  /** Cached value */
  value: T;
  /** Expiration timestamp in milliseconds */
  expiresAt: number | null;
  /** Creation timestamp in milliseconds */
  createdAt: number;
  /** Last access timestamp */
  lastAccessed: number;
  /** Number of times accessed */
  accessCount: number;
}

/**
 * Cache statistics interface.
 */
export interface ICacheStats {
  /** Total items in cache */
  size: number;
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Cache hit rate percentage */
  hitRate: number;
  /** Memory usage estimate in bytes */
  memoryUsage: number;
}

/**
 * Service for in-memory caching with TTL support.
 * Provides a simple key-value cache with expiration and statistics.
 * Thread-safe operations for concurrent access.
 */
@Injectable()
export class CacheService {
  private cache = new Map<string, ICacheEntry<any>>();
  private hits = 0;
  private misses = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  /**
   * Starts periodic cleanup of expired cache entries.
   * Runs every 60 seconds by default.
   *
   * @private
   */
  private startCleanupInterval(): void {
    const cleanupIntervalMs = parseInt(
      process.env.CACHE_CLEANUP_INTERVAL || '60000',
    );
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  /**
   * Sets a value in cache with optional TTL.
   *
   * @param key Cache key identifier
   * @param value Data to cache
   * @param ttlSeconds Time to live in seconds (null = no expiration)
   * @example
   * ```typescript
   * await cacheService.set('user:123', userData, 3600); // 1 hour
   * ```
   */
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const expiresAt = ttlSeconds
      ? Date.now() + ttlSeconds * 1000
      : null;

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
    });
  }

  /**
   * Retrieves value from cache if exists and not expired.
   *
   * @param key Cache key to retrieve
   * @returns Cached value or null if not found/expired
   */
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update access metadata
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    this.hits++;

    return entry.value as T;
  }

  /**
   * Checks if key exists in cache and is not expired.
   *
   * @param key Cache key to check
   * @returns Boolean existence flag
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Removes entry from cache.
   *
   * @param key Cache key to remove
   * @returns Boolean indicating if key was found and removed
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clears entire cache.
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Gets or sets cached value using callback function.
   *
   * @param key Cache key
   * @param callback Function to generate value if not cached
   * @param ttlSeconds Time to live in seconds
   * @returns Cached or generated value
   */
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttlSeconds?: number,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await callback();
    this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Removes all expired cache entries.
   * Called periodically by cleanup interval.
   */
  cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.debug(`Cache cleanup: removed ${removed} expired entries`);
    }
  }

  /**
   * Gets cache statistics and metrics.
   *
   * @returns Cache statistics object
   */
  getStats(): ICacheStats {
    const size = this.cache.size;
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    let memoryUsage = 0;

    // Estimate memory usage
    for (const [key, entry] of this.cache.entries()) {
      memoryUsage += key.length * 2; // rough estimate
      memoryUsage += JSON.stringify(entry.value).length;
    }

    return {
      size,
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage,
    };
  }

  /**
   * Invalidates cache entries matching pattern.
   * Useful for invalidating related keys.
   *
   * @param pattern Regex pattern to match keys
   * @returns Number of entries removed
   */
  invalidatePattern(pattern: RegExp | string): number {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    let removed = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Gets all cache keys currently in cache.
   *
   * @returns Array of cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Gets cache entry metadata without retrieving value.
   *
   * @param key Cache key
   * @returns Cache entry metadata or null
   */
  getMetadata(key: string): Omit<ICacheEntry<any>, 'value'> | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const { value, ...metadata } = entry;
    return metadata;
  }

  /**
   * Cleanup on service destruction.
   */
  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
