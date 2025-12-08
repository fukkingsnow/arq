# Phase 18 Step 5: Context Memory System

## Overview

The Context Memory System is the foundational component enabling ARQIUM browser to remember and understand user context across sessions. This system captures, stores, and retrieves browsing context including page content, user interactions, conversation history, and environmental state. It serves as the knowledge base for self-learning and continuous improvement capabilities.

## 1. Core Context Memory Architecture

```typescript
interface ContextMemoryEntry {
  id: string;
  timestamp: number;
  sessionId: string;
  tabId: number;
  url: string;
  title: string;
  pageContent: string; // Indexed snapshot
  contentHash: string; // For deduplication
  userActions: UserAction[];
  deviceState: DeviceState;
  networkState: NetworkState;
  memoryType: 'page_visit' | 'user_interaction' | 'search' | 'form_input' | 'navigation' | 'error';
  contextTags: string[];
  importance: number; // 0-100 importance score
  embeddings?: Float32Array; // Semantic embeddings for ML
  linkedContexts: string[]; // References to related entries
  ttl?: number; // Time-to-live in milliseconds
}

interface UserAction {
  type: 'click' | 'scroll' | 'input' | 'submit' | 'hover' | 'focus';
  timestamp: number;
  element: {
    tag: string;
    id?: string;
    class?: string;
    text?: string;
  };
  position?: { x: number; y: number };
  value?: string; // For input actions
  duration?: number; // Time spent on element
}

interface DeviceState {
  userAgent: string;
  screenResolution: { width: number; height: number };
  timezone: string;
  language: string;
  isDarkMode: boolean;
  cpuCores: number;
  memoryAvailable: number;
}

interface NetworkState {
  connectionType: 'wifi' | '4g' | '5g' | 'ethernet';
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface ContextMemoryManager {
  captureContext(): Promise<ContextMemoryEntry>;
  storeContext(context: ContextMemoryEntry): Promise<string>;
  retrieveContext(id: string): Promise<ContextMemoryEntry | null>;
  searchContexts(query: string, options?: SearchOptions): Promise<ContextMemoryEntry[]>;
  getSessionContexts(sessionId: string): Promise<ContextMemoryEntry[]>;
  deleteContext(id: string): Promise<void>;
  deleteContextsOlderThan(days: number): Promise<number>;
  computeContextSimilarity(id1: string, id2: string): Promise<number>;
  clusterContexts(): Promise<ContextCluster[]>;
}
```

## 2. Storage Architecture

```typescript
interface StorageLayer {
  // Primary hot storage (< 30 days)
  indexedDB: {
    store: 'context_entries' | 'embeddings' | 'clusters';
    capacity: number; // 200MB
    ttl: 2592000000; // 30 days
  };
  
  // Secondary warm storage (30 days - 1 year)
  sqlite: {
    database: '~/.arqium/context/archive.db';
    capacity: number; // 1GB
    compression: 'brotli';
  };
  
  // Tertiary cold storage (1+ year)
  cloudSync: {
    provider: 'arq-cloud';
    encryption: 'aes-256-gcm';
    retention: 'user-configurable';
  };
}

interface ContextIndexing {
  // Full-text search index
  ftsIndex: {
    fields: ['title', 'pageContent', 'contextTags', 'userActions'];
    engine: 'sqlite-fts5';
    updateFrequency: 'real-time';
  };
  
  // Semantic embeddings
  semanticIndex: {
    model: 'sentence-transformers/all-MiniLM-L6-v2';
    dimensions: 384;
    updateFrequency: 'hourly';
    threshold: 0.85;
  };
  
  // Time-based index
  timeIndex: {
    granularity: 'minute';
    enabledForLastNDays: 7;
  };
}
```

## 3. Context Capture System

```typescript
interface ContextCaptureEngine {
  // Page content extraction
  extractPageContent(document: Document): Promise<string>;
  extractMetadata(document: Document): Promise<PageMetadata>;
  extractImages(document: Document): Promise<ImageReference[]>;
  
  // User interaction tracking
  trackUserActions(window: Window): Promise<UserAction[]>;
  detectPatterns(actions: UserAction[]): Promise<InteractionPattern[]>;
  
  // State snapshots
  captureScrollState(): ScrollState;
  captureFocusState(): FocusState;
  captureFormState(): FormState;
  
  // Device and network state
  captureDeviceState(): DeviceState;
  captureNetworkState(): Promise<NetworkState>;
}

interface PageMetadata {
  title: string;
  description: string;
  keywords: string[];
  author?: string;
  ogImage?: string;
  structuredData?: object;
  language: string;
  readingTime: number;
}

interface InteractionPattern {
  type: string;
  frequency: number;
  avgDuration: number;
  relevantElements: string[];
  associatedOutcomes: string[];
}
```

## 4. Context Retrieval and Search

```typescript
interface ContextRetrieval {
  // Keyword-based search
  keywordSearch(query: string, limit?: number): Promise<ContextMemoryEntry[]>;
  
  // Semantic search
  semanticSearch(query: string, threshold?: number): Promise<ContextMemoryEntry[]>;
  
  // Time-range queries
  getContextsByTimeRange(start: number, end: number): Promise<ContextMemoryEntry[]>;
  
  // Topic-based retrieval
  getContextsByTopic(topic: string): Promise<ContextMemoryEntry[]>;
  
  // Similarity-based retrieval
  getSimilarContexts(contextId: string, limit?: number): Promise<ContextMemoryEntry[]>;
  
  // Cross-session context
  getCrossSessionContext(pattern: string): Promise<CrossSessionResult>;
}

interface CrossSessionResult {
  relevantSessions: SessionContext[];
  sharedPatterns: Pattern[];
  recommendations: Recommendation[];
}
```

## 5. Context Enrichment Pipeline

```typescript
interface EnrichmentPipeline {
  // Named Entity Recognition
  extractEntities(content: string): Promise<Entity[]>;
  
  // Sentiment Analysis
  analyzeSentiment(content: string): Promise<SentimentScore>;
  
  // Topic Modeling
  extractTopics(content: string): Promise<Topic[]>;
  
  // Relationship Detection
  detectRelationships(contexts: ContextMemoryEntry[]): Promise<ContextRelationship[]>;
  
  // Importance Scoring
  scoreImportance(context: ContextMemoryEntry): Promise<number>;
  
  // Context Linking
  linkRelatedContexts(context: ContextMemoryEntry): Promise<string[]>;
}

interface Entity {
  type: 'person' | 'organization' | 'location' | 'product' | 'date' | 'event';
  text: string;
  confidence: number;
  metadata?: object;
}

interface Topic {
  name: string;
  keywords: string[];
  probability: number;
}

interface ContextRelationship {
  sourceId: string;
  targetId: string;
  type: 'similar' | 'sequential' | 'causal' | 'hierarchical';
  strength: number;
}
```

## 6. Context Lifecycle Management

```typescript
interface ContextLifecycle {
  // Creation and ingestion
  ingestContext(raw: RawContext): Promise<ContextMemoryEntry>;
  
  // Warm phase (< 7 days)
  promoteToHot(contextId: string): Promise<void>;
  indexWarmContext(context: ContextMemoryEntry): Promise<void>;
  
  // Cool phase (7-30 days)
  promoteToCool(contextId: string): Promise<void>;
  compressContext(context: ContextMemoryEntry): Promise<CompressedContext>;
  
  // Archive phase (30+ days)
  archiveContext(contextId: string): Promise<void>;
  
  // Deletion
  deleteContext(contextId: string): Promise<void>;
  purgeExpiredContexts(): Promise<number>;
  
  // Recovery
  restoreContext(contextId: string): Promise<ContextMemoryEntry>;
}

interface CompressedContext {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressionMethod: 'brotli';
  originalHash: string;
}
```

## 7. Privacy and Security

```typescript
interface PrivacyControls {
  // Sensitive data filtering
  filterSensitiveData(context: ContextMemoryEntry): Promise<ContextMemoryEntry>;
  maskPasswords(context: ContextMemoryEntry): ContextMemoryEntry;
  maskCreditCards(content: string): string;
  maskPersonalInfo(content: string): string;
  
  // Encryption
  encryptContext(context: ContextMemoryEntry, key: CryptoKey): Promise<EncryptedContext>;
  decryptContext(encrypted: EncryptedContext, key: CryptoKey): Promise<ContextMemoryEntry>;
  
  // Access Control
  enforceAccessControl(userId: string, contextId: string): Promise<boolean>;
  
  // Audit Logging
  logContextAccess(userId: string, contextId: string, action: string): Promise<void>;
}

interface SensitiveDataPatterns {
  passwords: RegExp;
  creditCards: RegExp;
  ssn: RegExp;
  emails: RegExp;
  phoneNumbers: RegExp;
  apiKeys: RegExp;
  personalInfo: RegExp;
}
```

## 8. Performance Targets

- Context capture: < 100ms
- Context storage: < 50ms
- Simple retrieval: < 10ms
- Keyword search (100k entries): < 200ms
- Semantic search: < 500ms
- Entity extraction: < 200ms
- Context enrichment: < 500ms (async)
- Index update: < 1s (background)
- Memory overhead: < 50MB per 10k contexts
- Query response: < 1s (p99)

## 9. Testing Strategy

- Unit tests for context capture, storage, retrieval
- Integration tests for full lifecycle
- Performance tests for search at scale (1M+ contexts)
- Privacy tests for sensitive data filtering
- Security tests for encryption and access control
- Stress tests for concurrent operations

## 10. Integration Points

- **History System**: Stores page visits and navigation
- **Bookmarks System**: Captures bookmarked page context
- **Password Manager**: Integrates form context
- **User Mode**: Provides context to user assistance
- **Self-Learning System**: Feeds context to ML models
- **Analytics**: Uses context for behavioral analysis

## 11. Future Enhancements

- Graph-based context relationships
- Real-time context streaming
- Multi-user context sharing with privacy
- Context prediction and pre-fetching
- Advanced temporal analysis
- Integration with external knowledge bases

---

**Status**: Phase 18 Step 5 - Context Memory System (380 lines)
**Next**: Phase 19 - Self-Learning Architecture
