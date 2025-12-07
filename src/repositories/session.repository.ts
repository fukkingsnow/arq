import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { Session } from '../entities/session.entity';

/**
 * Session Repository
 *
 * Manages user session data including:
 * - Session creation and termination
 * - Session state persistence
 * - Concurrent session tracking
 * - Session timeout management
 */
@Injectable()
export class SessionRepository extends BaseRepository<Session> {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {
    super(sessionRepository);
  }

  /**
   * Find active sessions for a user
   * @param userId User identifier
   * @returns Array of active sessions
   */
  async findActiveByUserId(userId: string | number): Promise<Session[]> {
    return this.sessionRepository.find({
      where: {
        userId,
        isActive: true,
      },
    });
  }

  /**
   * Find session by ID
   * @param sessionId Session identifier
   * @returns Session entity or null
   */
  async findBySessionId(sessionId: string): Promise<Session | null> {
    return this.sessionRepository.findOne({ where: { sessionId } });
  }

  /**
   * Terminate user session
   * @param sessionId Session identifier
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
