import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { BrowserSession } from '../entities/browser-session.entity';
/**
 * BrowserSession Repository
 *
 * Handles database operations for browser sessions including:
 * - BrowserSession session creation and management
 * - Tab automation records
 * - Session history tracking
 * - State persistence
 */
@Injectable()
export class BrowserRepository extends BaseRepository<BrowserSession> {
  constructor(
    @InjectRepository(BrowserSession)
    private readonly browserRepository: Repository<BrowserSession>,
  ) {
    super(browserRepository);
  }

  /**
   * Find browser by session ID
   * @param sessionId Session identifier
   * @returns BrowserSession entity or null
   */
  async findBySessionId(sessionId: string): Promise<BrowserSession | null> {
    return this.browserRepository.findOne({ where: { sessionId } });
  }

  /**
   * Find all active browser sessions
   * @returns Array of active browsers
   */
  async findActive(): Promise<BrowserSession[]> {
    return this.browserRepository.find({
      where: { isActive: true },
    });
  }

  /**
   * Mark browser session as inactive
   * @param id BrowserSession ID
   * @returns Success flag
   */
  async deactivate(id: string | number): Promise<boolean> {
    return this.update(id, { isActive: false } as any).then(Boolean);
  }
}
