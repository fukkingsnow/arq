/**
 * Context Engine Types - Phase 10: Advanced Context Management
 * Multi-level memory hierarchy with embedding-based compression
 */

import { UUID } from 'crypto';

/**
 * Memory tier enumeration
 */
export enum MemoryTier {
  L1_HOT = 'l1_hot',       // Last 5 interactions (hot data)
  L2_WARM = 'l2_warm',     // Recent 50 interactions (warm data)
  L3_COLD = 'l3_cold',     // Full conversation history (cold data)
  ARCHIVED = 'archived'    // Compressed historical data
}

/**
 * Single context interaction
 */
export interface ContextInteraction {
  id: string;
  sessionId: string;
  userId: string;
  timestamp: Date;
  userMessage: string;
  assistantResponse: string;
  metadata?: {
    intent?: string;
    entities?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
    confidence?: number;
  };
}

/**
 * Embedding representation for vector similarity
 */
export interface ContextEmbedding {
  id: string;
  sessionId: string;
  embedding: number[];  // 384-dim vector (Sentence-BERT)
  compressedText: string;
  ttlDays: number;
  createdAt: Date;
}

/**
 * Multi-level context with compression
 */
export interface EnrichedContext {
  sessionId: string;
  userId: string;
  l1Cache: ContextInteraction[];           // Last 5 (hot)
  l2Cache: ContextInteraction[];           // Recent 50 (warm)
  l3Store: ContextInteraction[];           // Full history (cold)
  compressedSummaries: ContextEmbedding[]; // Vector-based summaries
  totalInteractions: number;
  memoryUsageBytes: number;
  compressionRatio: number;  // (original - compressed) / original
}

/**
 * Context storage interface
 */
export interface IContextStore {
  // L1 (Hot) operations
  getL1Context(sessionId: string): Promise<ContextInteraction[]>;
  setL1Context(sessionId: string, interactions: ContextInteraction[]): Promise<void>;
  
  // L2 (Warm) operations
  getL2Context(sessionId: string): Promise<ContextInteraction[]>;
  setL2Context(sessionId: string, interactions: ContextInteraction[]): Promise<void>;
  
  // L3 (Cold) operations
  getL3Context(sessionId: string, limit?: number): Promise<ContextInteraction[]>;
  setL3Context(sessionId: string, interactions: ContextInteraction[]): Promise<void>;
  
  // Compression
  compressOldContext(sessionId: string): Promise<ContextEmbedding>;
  retrieveSimilarContext(embedding: number[]): Promise<ContextEmbedding[]>;
  
  // Cleanup
  purgeExpiredContext(sessionId: string): Promise<void>;
}

/**
 * Vector database interface
 */
export interface IVectorStore {
  insert(embedding: ContextEmbedding): Promise<void>;
  searchSimilar(vector: number[], topK: number): Promise<ContextEmbedding[]>;
  delete(id: string): Promise<void>;
  deleteExpired(ttlDays: number): Promise<number>;
}

/**
 * Context Manager service interface
 */
export interface IContextManager {
  // Lifecycle
  initialize(sessionId: string, userId: string): Promise<void>;
  cleanup(sessionId: string): Promise<void>;
  
  // Read
  getContext(sessionId: string): Promise<EnrichedContext>;
  getContextSummary(sessionId: string): Promise<string>;
  
  // Write
  addInteraction(sessionId: string, interaction: ContextInteraction): Promise<void>;
  updateInteraction(sessionId: string, interaction: ContextInteraction): Promise<void>;
  
  // Compression
  compressContext(sessionId: string): Promise<void>;
  
  // Search
  retrieveRelevantContext(sessionId: string, query: string): Promise<ContextInteraction[]>;
}

/**
 * Cost metrics for resource optimization
 */
export interface CostMetrics {
  tokensUsed: number;
  cacheHitRate: number;  // % (target: 75%+)
  memoryUsageBytes: number;
  latencyMs: number;
  costEstimateCents: number;  // USD in cents
}

/**
 * Configuration
 */
export interface ContextEngineConfig {
  l1MaxSize: number;        // Max items in L1 (default: 5)
  l2MaxSize: number;        // Max items in L2 (default: 50)
  embeddingModel: string;    // Model (default: 'all-MiniLM-L6-v2')
  embeddingDim: number;      // Vector dimension (default: 384)
  compressionTtlDays: number; // TTL for compressed data (default: 30)
  enableCostTracking: boolean; // Cost monitoring (default: true)
}
