import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ContextInteraction,
  ContextEmbedding,
  EnrichedContext,
  IContextManager,
  IContextStore,
  IVectorStore,
  MemoryTier,
  ContextEngineConfig,
  CostMetrics,
} from '../context.types';
/**
 * Phase 10: Advanced Context Management (ACM) Service
 * Multi-level memory hierarchy with embedding-based compression
 * 
 * Implements IContextManager interface with:
 * - L1 Cache (Hot): Last 5 interactions in-memory
 * - L2 Cache (Warm): Recent 50 interactions with TTL
 * - L3 Store (Cold): Full conversation history in PostgreSQL
 * - Compression: Vector-based summarization of old data
 */
@Injectable()
export class ContextManager implements IContextManager {
  private readonly logger = new Logger(ContextManager.name);
  private readonly config: ContextEngineConfig;
  private l1Cache: Map<string, ContextInteraction[]> = new Map();
  private costMetrics: Map<string, CostMetrics> = new Map();
    private redis!: Redis;
    private contextRepository!: Repository<ContextInteraction>;
  
  constructor(
  ) {
    this.config = {
l1MaxSize: 5,
l2MaxSize: 50,
      embeddingModel: 'all-MiniLM-L6-v2',      embeddingDim: 384,      compressionTtlDays: 30,
      enableCostTracking: true,
    };
  }

  /**
   * Initialize session context
   */
  async initialize(sessionId: string, userId: string): Promise<void> {
    this.logger.log(`Initializing context for session ${sessionId}`);
    
    // Initialize cost metrics
    if (this.config.enableCostTracking) {
      this.costMetrics.set(sessionId, {
        tokensUsed: 0,
        cacheHitRate: 0,
        memoryUsageBytes: 0,
        latencyMs: 0,
        costEstimateCents: 0,
      });
    }
    
    // Initialize L1 cache
    this.l1Cache.set(sessionId, []);
    
    // Initialize Redis L2 cache key
    const l2Key = this.getRedisKey(sessionId, MemoryTier.L2_WARM);
    await this.redis.del(l2Key);
  }

  /**
   * Get enriched context (multi-tier)
   */
  async getContext(sessionId: string): Promise<EnrichedContext> {
    const startTime = Date.now();
    
    try {
      // Get L1 (hot cache)
      const l1Cache = this.l1Cache.get(sessionId) || [];
      
      // Get L2 (warm cache from Redis)
      const l2Cache = await this.getL2Context(sessionId);
      
      // Get L3 (cold store, limited sample)
      const l3Store = await this.getL3Context(sessionId, 100);
      
      // Get compressed summaries
      const compressedSummaries = await this.getCompressedSummaries(sessionId);
      
      const totalInteractions = l1Cache.length + l2Cache.length + l3Store.length;
      const memoryBytes = this.estimateMemoryUsage({
        l1Cache,
        l2Cache,
        l3Store,
        compressedSummaries,
        totalInteractions: 0,
        memoryUsageBytes: 0,
        compressionRatio: 0,
      } as any);
      
      const enrichedContext: EnrichedContext = {
        sessionId,
        userId: '', // TODO: get from session
        l1Cache,
        l2Cache,
        l3Store,
        compressedSummaries,
        totalInteractions,
        memoryUsageBytes: memoryBytes,
        compressionRatio: this.calculateCompressionRatio(totalInteractions, compressedSummaries.length),
      };
      
      // Update metrics
      if (this.config.enableCostTracking) {
        this.updateMetrics(sessionId, startTime);
      }
      
      return enrichedContext;
    } catch (error) {
      this.logger.error(`Failed to get context for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Add new interaction to L1 cache, cascade to L2/L3
   */
  async addInteraction(
    sessionId: string,
    interaction: ContextInteraction,
  ): Promise<void> {
    try {
      // Add to L1 (hot cache)
      let l1 = this.l1Cache.get(sessionId) || [];
      l1.push(interaction);
      
      // Cascade older items when L1 exceeds max size
      if (l1.length > this.config.l1MaxSize) {
        const toL2 = l1.shift();
        if (toL2) {
          await this.setL2Context(sessionId, [toL2, ...(await this.getL2Context(sessionId))]);
        }
      }
      
      this.l1Cache.set(sessionId, l1);
      
      // Persist to L3
      await this.contextRepository.save(interaction);
    } catch (error) {
      this.logger.error(`Failed to add interaction:`, error);
      throw error;
    }
  }

  /**
   * Get L2 (warm) context from Redis
   */
  async getL2Context(sessionId: string): Promise<ContextInteraction[]> {
    const key = this.getRedisKey(sessionId, MemoryTier.L2_WARM);
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Set L2 (warm) context in Redis with TTL
   */
  async setL2Context(
    sessionId: string,
    interactions: ContextInteraction[],
  ): Promise<void> {
    const key = this.getRedisKey(sessionId, MemoryTier.L2_WARM);
    const ttlSeconds = 86400; // 24 hours
    await this.redis.setex(key, ttlSeconds, JSON.stringify(interactions));
  }

  /**
   * Get L3 (cold) context from PostgreSQL
   */
  async getL3Context(
    sessionId: string,
    limit = 1000,
  ): Promise<ContextInteraction[]> {
    return this.contextRepository.find({
      where: { sessionId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /**
   * Compress old context using embeddings
   */
  async compressContext(sessionId: string): Promise<void> {
    try {
      const l3 = await this.getL3Context(sessionId);
      
      if (l3.length > this.config.l1MaxSize + this.config.l2MaxSize) {
        // Compress oldest 50% of interactions
        const toCompress = l3.slice(Math.floor(l3.length / 2));
        // TODO: Generate embeddings for toCompress
        // await this.vectorStore.insert(embedding);
        this.logger.log(`Compressed ${toCompress.length} interactions for session ${sessionId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to compress context:`, error);
    }
  }

  /**
   * Cleanup and persist context
   */
  async cleanup(sessionId: string): Promise<void> {
    // Archive L1/L2 to L3
    const l1 = this.l1Cache.get(sessionId) || [];
    const l2 = await this.getL2Context(sessionId);
    
    if (l1.length > 0 || l2.length > 0) {
      await this.contextRepository.save([...l1, ...l2]);
    }
    
    // Clear caches
    this.l1Cache.delete(sessionId);
    await this.redis.del(this.getRedisKey(sessionId, MemoryTier.L2_WARM));
    
    this.logger.log(`Cleaned up context for session ${sessionId}`);
  }

  // ===== Helper Methods =====

  private getRedisKey(sessionId: string, tier: MemoryTier): string {
    return `context:${sessionId}:${tier}`;
  }

  private async getCompressedSummaries(
    sessionId: string,
  ): Promise<ContextEmbedding[]> {
    // TODO: Query vector store
    return [];
  }

  private estimateMemoryUsage(context: EnrichedContext): number {
    const l1Bytes = context.l1Cache.length * 500; // ~500 bytes per interaction
    const l2Bytes = context.l2Cache.length * 500;
    const l3Bytes = Math.min(context.l3Store.length, 100) * 500;
    return l1Bytes + l2Bytes + l3Bytes;
  }

  private calculateCompressionRatio(
    totalInteractions: number,
    compressedCount: number,
  ): number {
    return totalInteractions > 0 ? (totalInteractions - compressedCount) / totalInteractions : 0;
  }

  private updateMetrics(sessionId: string, startTime: number): void {
    const latency = Date.now() - startTime;
    const metrics = this.costMetrics.get(sessionId);
    if (metrics) {
      metrics.latencyMs = latency;
      // TODO: Update other metrics
    }
  }

  async getContextSummary(sessionId: string): Promise<string> {
    const context = await this.getContext(sessionId);
    return `Context: ${context.totalInteractions} interactions, ${Math.round(context.memoryUsageBytes / 1024)}KB`;
  }

  async updateInteraction(
    sessionId: string,
    interaction: ContextInteraction,
  ): Promise<void> {
    await this.contextRepository.save(interaction);
  }

  async retrieveRelevantContext(
    sessionId: string,
    query: string,
  ): Promise<ContextInteraction[]> {
    // TODO: Use vector similarity search
    return this.getL3Context(sessionId, 10);
  }
}
