import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';@Entity('conversations')

export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  taskId: string;

  
  @Column()
  role: 'user' | 'assistant';

  @Column('text')
  content: string;

  @Column('simple-json', { nullable: true })
  metadata?: {
    tokenCount?: number;
    processingTime?: number;
    model?: string;
    source?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 'active', nullable: false })
  status: 'active' | 'archived';

  @Column({ nullable: true })
  parentConversationId?: string;
}

export interface ConversationDTO {
  id: string;
  taskId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  timestamp: string;
}
