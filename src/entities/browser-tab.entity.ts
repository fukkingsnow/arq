import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { BrowserSession } from './browser-session.entity';
import { ActionLog } from './action-log.entity';

/**
 * BrowserTab Entity - Represents a browser tab within a session
 * Stores information about individual tabs open in browser automation
 */
@Entity('browser_tabs')
@Index(['sessionId'])
@Index(['sessionId', 'title'])
export class BrowserTab {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'integer', default: 0 })
  tabIndex: number;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isClosed: boolean;

  @Column({ type: 'text', nullable: true })
  screenshot: string;

  @Column({ type: 'text', nullable: true })
  html: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'integer', default: 0 })
  loadTime: number;

  @Column({ type: 'varchar', length: 50, default: 'loading' })
  status: 'loading' | 'complete' | 'error';

  @ManyToOne(() => BrowserSession, (session) => session.tabs, { onDelete: 'CASCADE' })
  session: BrowserSession;

  @OneToMany(() => ActionLog, (log) => log.tab, { cascade: true })
  actions: ActionLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
