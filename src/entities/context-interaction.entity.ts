import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * ContextInteraction Entity
 * 
 * Represents a single interaction within the advanced context management system.
 * Phase 10: Advanced Context Management (ACM)
 * 
 * Stores user inputs, assistant responses, and metadata about context interactions.
 * Supports multi-tier memory management (L1 hot cache, L2 database, L3 archive).
 */
@Entity('context_interactions')
@Index(['sessionId', 'createdAt'])
@Index(['userId', 'createdAt'])
export class ContextInteraction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'uuid', nullable: false })
  sessionId: string;

  @Column({ type: 'text', nullable: false })
  userInput: string;

  @Column({ type: 'text', nullable: false })
  assistantResponse: string;

  @Column({
    type: 'enum',
    enum: ['L1_HOT_CACHE', 'L2_DATABASE', 'L3_ARCHIVE'],
    default: 'L2_DATABASE',
  })
  memoryTier: 'L1_HOT_CACHE' | 'L2_DATABASE' | 'L3_ARCHIVE';

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  metadata?: {
    inputTokens?: number;
    outputTokens?: number;
    modelId?: string;
    temperature?: number;
    topP?: number;
  };

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  contextEmbedding?: {
    vector?: number[];
    dimensionality?: number;
    modelVersion?: string;
  };

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  costMetrics?: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    currency: string;
  };

  @Column({ type: 'boolean', default: false })
  isCompressed: boolean;

  @Column({ type: 'text', nullable: true })
  compressedPayload?: string;

  @Column({ type: 'float', nullable: true })
  compressionRatio?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt?: Date;
}
