import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('development_tasks')
@Index(['status'])
@Index(['taskType'])
export class DevelopmentTaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 300 })
  developmentGoal: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', enum: ['bug', 'feature', 'refactor', 'research', 'performance', 'security'], default: 'feature' })
  taskType: string;

  @Column({ type: 'varchar', enum: ['queued', 'in_progress', 'paused', 'completed', 'failed', 'cancelled'], default: 'queued' })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  branchName: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'int', default: 1 })
  currentIteration: number;

  @Column({ type: 'int', default: 5 })
  maxIterations: number;

  @Column({ type: 'varchar', enum: ['low', 'medium', 'high'], default: 'medium' })
  priority: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  currentPhase: string;

  @Column({ type: 'json', nullable: true })
  metrics: {
    linesAdded: number;
    linesModified: number;
    filesChanged: number;
    codeQualityScore: number;
  };

  @Column({ type: 'json', nullable: true })
  strategy: {
    analyzedAt: string;
    recommendations: Array<{
      area: string;
      priority: string;
      estimatedEffort: string;
      expectedImpact: string;
    }>;
  };

  @Column({ type: 'varchar', length: 255, nullable: true })
  pullRequestUrl: string;

  @Column({ type: 'int', nullable: true })
  pullRequestNumber: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;
}
