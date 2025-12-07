import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { Browser } from '../entities/browser.entity';

/**
 * Browser Repository
 *
 * Handles database operations for browser sessions including:
 * - Browser session creation and management
 * - Tab automation records
 * - Session history tracking
 * - State persistence
 */
@Injectable()
export class BrowserRepository extends BaseRepository<Browser> {
  constructor(
    @InjectRepository(Browser)
    private readonly browserRepository: Repository<Browser>,
  ) {
    super(browserRepository);
  }

  /**
   * Find browser by session ID
   * @param sessionId Session identifier
   * @returns Browser entity or null
   */
  async findBySessionId(sessionId: string): Promise<Browser | null> {
    return this.browserRepository.findOne({ where: { sessionId } });
  }

  /**
   * Find all active browser sessions
   * @returns Array of active browsers
   */
  async findActive(): Promise<Browser[]> {
    return this.browserRepository.find({
      where: { isActive: true },
    });
  }

  /**
   * Mark browser session as inactive
   * @param id Browser ID
   * @returns Success flag
   */
  async deactivate(id: string | number): Promise<boolean> {
    return this.update(id, { isActive: false } as any).then(Boolean);
  }
}
