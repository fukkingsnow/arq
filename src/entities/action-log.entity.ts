import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { BrowserTab } from './browser-tab.entity';
import { BrowserSession } from './browser-session.entity';

/**
 * ActionLog Entity - Records all user actions within browser automation
 * Tracks interactions like clicks, typing, navigation, etc.
 */
@Entity('action_logs')
@Index(['tabId'])
@Index(['sessionId'])
@Index(['sessionId', 'createdAt'])
export class ActionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tabId: string;

  @Column()
  sessionId: string;

  @Column({ type: 'varchar', length: 100 })
  actionType: string;

  @Column({ type: 'text' })
  selector: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'integer' })
  timestamp: number;

  @Column({ type: 'text', nullable: true })
  screenshot: string;

  @Column({ type: 'boolean', default: false })
  isError: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'integer', default: 0 })
  executionTime: number;

  @Column({ type: 'varchar', length: 50, default: 'success' })
  status: 'success' | 'failed' | 'pending';

  @ManyToOne(() => BrowserTab, (tab) => tab.actions, { onDelete: 'CASCADE' })
  tab: BrowserTab;

  @ManyToOne(() => BrowserSession, (session) => session.actions, { onDelete: 'CASCADE' })
  session: BrowserSession;

  @CreateDateColumn()
  createdAt: Date;
}
