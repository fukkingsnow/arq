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
import { User } from './user.entity';

@Entity('workflow_executions')
@Index(['workflowId', 'status'])
@Index(['userId', 'createdAt'])
@Index(['status', 'updatedAt'])
export class WorkflowExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workflowId: string;

  @ManyToOne(() => Workflow)
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('varchar', { length: 50, default: 'pending' })
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'aborted';

  @Column('jsonb', { nullable: true })
  input?: Record<string, any>; // Workflow execution input

  @Column('jsonb', { nullable: true })
  output?: Record<string, any>; // Final workflow output

  @Column('jsonb', { nullable: true })
  context?: Record<string, any>; // Shared context across steps

  @Column('int', { default: 0 })
  completedSteps: number; // Number of completed steps

  @Column('int', { default: 0 })
  failedSteps: number; // Number of failed steps

  @Column('int', { default: 0 })
  totalSteps: number; // Total number of steps in workflow

  @Column('bigint', { nullable: true })
  startedAt?: number; // Timestamp when execution started

  @Column('bigint', { nullable: true })
  completedAt?: number; // Timestamp when execution completed

  @Column('bigint', { nullable: true })
  duration?: number; // Total execution duration in milliseconds

  @Column('text', { nullable: true })
  errorMessage?: string; // Error details if execution failed

  @Column('varchar', { length: 255, nullable: true })
  currentStepId?: string; // Currently executing step ID

  @Column('simple-array', { nullable: true })
  executedStepIds?: string[]; // IDs of executed steps

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>; // Additional execution metadata

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
