import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { BrowserTab } from './browser-tab.entity';
import { ActionLog } from './action-log.entity';

/**
 * Browser session entity for tracking active browser automation sessions
 * Manages browser instance lifecycle and associated metadata
 */
@Entity('browser_sessions')
@Index(['userId'])
@Index(['sessionId'])
export class BrowserSession {
  /**
   * Unique session identifier (UUID)
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * User who owns this browser session
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * User ID reference
   */
  @Column({ type: 'uuid' })
  userId: string;

  /**
   * Unique browser session identifier
   * @example 'browser-session-abc123'
   */
  @Column({ type: 'varchar', length: 255, unique: true })
  sessionId: string;

  /**
   * Browser type (chromium, firefox, webkit)
   * @default 'chromium'
   */
  @Column({ type: 'enum', enum: ['chromium', 'firefox', 'webkit'], default: 'chromium' })
  browserType: 'chromium' | 'firefox' | 'webkit';

  /**
   * Headless mode status
   * @default true
   */
  @Column({ type: 'boolean', default: true })
  headless: boolean;

  /**
   * Number of active tabs/pages
   * @default 0
   */
  @Column({ type: 'integer', default: 0 })
  activeTabsCount: number;

  /**
   * Session status
   * @default 'active'
   */
  @Column({ type: 'enum', enum: ['active', 'paused', 'closed'], default: 'active' })
  status: 'active' | 'paused' | 'closed';

  /**
   * Connection status
   * @default true
   */
  @Column({ type: 'boolean', default: true })
  isConnected: boolean;

    /**
   * Tab count
   * @default 0
   */
  @Column({ type: 'integer', default: 0 })
  tabCount: number;

  /**
   * Active status
   * @default true
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Session end timestamp
   * @optional
   */
  @Column({ type: 'timestamp', nullable: true })
  endedAt?: Date;

  /**
   * Metadata (JSON)
   * @optional
   */
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  /**
   * Last activity timestamp
   */
  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt?: Date;

    /**
   * Browser tabs associated with this session
   */
  @OneToMany(() => BrowserTab, (tab) => tab.session)
  tabs: BrowserTab[];

  /**
   * Action logs for this session
   */
  @OneToMany(() => ActionLog, (action) => action.session)
  actions: ActionLog[];

  /**
   * Session creation timestamp
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Session last update timestamp
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
