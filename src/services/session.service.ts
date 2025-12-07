import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BrowserSession, ActionLog } from '../entities';

/**
 * SessionService - Manages user session operations
 * Handles session lifecycle and action logging
 */
@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(BrowserSession) private sessionRepo: Repository<BrowserSession>,
    @InjectRepository(ActionLog) private actionRepo: Repository<ActionLog>,
  ) {}

  /**
   * Get all active sessions for user
   * @param userId User ID
   * @returns Array of active sessions
   */
  async getActiveSessions(userId: string) {
    return await this.sessionRepo.find({
      where: { userId, status: 'active' },
    });
  }

  /**
   * Get session details with actions
   * @param sessionId Session ID
   * @returns Session with actions
   */
  async getSessionDetails(sessionId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['actions'],
    });
    return session;
  }

  /**
   * Get session action history
   * @param sessionId Session ID
   * @returns Array of actions
   */
  async getSessionActions(sessionId: string) {
    return await this.actionRepo.find({ where: { sessionId } });
  }

  /**
   * Log action in session
   * @param sessionId Session ID
   * @param action Action data
   */
  async logAction(sessionId: string, action: any) {
    const log = this.actionRepo.create({ sessionId, ...action });
    return await this.actionRepo.save(log);
  }

  /**
   * Get session statistics
   * @param sessionId Session ID
   */
  async getSessionStats(sessionId: string) {
    const actionCount = await this.actionRepo.count({ where: { sessionId } });
    return { actionCount };
  }
}
