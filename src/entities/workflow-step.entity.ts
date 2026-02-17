import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Workflow } from './workflow.entity';

@Entity('workflow_steps')
@Index(['workflowId', 'order'])
@Index(['workflowId', 'status'])
export class WorkflowStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workflowId: string;

  @ManyToOne(() => Workflow, (workflow) => workflow.steps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 50 })
  type: string; // 'action', 'condition', 'loop', 'wait', etc.

  @Column('int')
  order: number;

  @Column('jsonb', { default: {} })
  config: Record<string, any>; // Step-specific configuration

  @Column('varchar', { length: 50, default: 'pending' })
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

  @Column('jsonb', { nullable: true })
  input?: Record<string, any>; // Input data for the step

  @Column('jsonb', { nullable: true })
  output?: Record<string, any>; // Output data from step execution

  @Column('text', { nullable: true })
  errorMessage?: string; // Error details if step failed

  @Column('int', { default: 0 })
  retryCount: number; // Number of execution retries

  @Column('int', { default: 3 })
  maxRetries: number; // Maximum allowed retries

  @Column('varchar', { length: 255, nullable: true })
  nextStepId?: string; // Reference to next step (for branching)

  @Column('simple-array', { nullable: true })
  dependencies?: string[]; // IDs of steps that must complete first

  @Column('bigint', { nullable: true })
  executionTime?: number; // Milliseconds taken to execute

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
