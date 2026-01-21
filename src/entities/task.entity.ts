import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255 })
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('varchar', { length: 20, nullable: true })
  priority?: 'low' | 'medium' | 'high';

  @Column('varchar', { nullable: true })
  dueDate?: string;

    @Column('varchar', { length: 50, default: 'feature' })
  type: string;

  @Column('varchar', { default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt?: Date;}
