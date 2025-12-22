import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';
import { Task } from '../../arq/entities/task.entity';

@Entity('conversations')
@Index(['taskId', 'createdAt'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  taskId: string;

  @ManyToOne(() => Task)
  task: Task;

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
