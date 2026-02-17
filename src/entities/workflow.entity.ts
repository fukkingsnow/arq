import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  userId: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('jsonb')
  steps: any[];

  @Column('varchar', { length: 50, default: 'draft' })
  status: 'draft' | 'active' | 'paused' | 'archived';

  @Column('jsonb', { nullable: true })
  errorHandling: {
    retryCount?: number;
    retryDelay?: number;
    onError?: string;
  };

  @Column('jsonb', { nullable: true })
  variables: Record<string, any>;

  @Column('int', { default: 0 })
  executionCount: number;

  @Column('int', { default: 0 })
  failureCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('timestamp', { nullable: true })
  lastExecutedAt: Date;
}
