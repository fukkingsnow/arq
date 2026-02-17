import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { BrowserSession } from '../entities/browser-session.entity';

/**
 * BrowserSession Repository
 *
 * Manages user session data including:
 * - BrowserSession creation and termination
 * - BrowserSession state persistence
 * - Concurrent session tracking
 * - BrowserSession timeout management
 */
@Injectable()
export class SessionRepository extends BaseRepository<BrowserSession> {
  constructor(
    @InjectRepository(BrowserSession)
    private readonly sessionRepository: Repository<BrowserSession>,
  ) {
    super(sessionRepository);
  }

  /**
   * Find active sessions for a user
   * @param userId User identifier
   * @returns Array of active sessions
   */
  async findActiveByUserId(userId: string | number): Promise<BrowserSession[]> {
    return this.sessionRepository.find({
      where: {
        userId: userId as string,        isActive: true,
      },
    });
  }

  /**
   * Find session by ID
   * @param sessionId BrowserSession identifier
   * @returns BrowserSession entity or null
   */
  async findBySessionId(sessionId: string): Promise<BrowserSession | null> {
    return this.sessionRepository.findOne({ where: { sessionId } });
  }

  /**
   * Terminate user session
   * @param sessionId BrowserSession identifier
   * @returns Success flag
   */
  async terminateSession(sessionId: string): Promise<boolean> {
    const session = await this.findBySessionId(sessionId);
    if (!session) return false;
    return this.update(session.id, { isActive: false } as any).then(Boolean);
  }

  /**
   * Terminate all sessions for user
   * @param userId User identifier
   * @returns Number of terminated sessions
   */
  async terminateAllUserSessions(userId: string | number): Promise<number> {
    const sessions = await this.findActiveByUserId(userId);
    let count = 0;
    for (const session of sessions) {
      const success = await this.update(session.id, { isActive: false } as any);
      if (success) count++;
    }
    return count;
  }
}
