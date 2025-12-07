import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { SessionService } from '../services';

/**
 * SessionController - Manages session endpoints
 * Handles session lifecycle and activity logging
 */
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  /**
   * GET /sessions/user/:userId/active - Get active sessions
   * @param userId User ID
   * @returns Array of active sessions
   */
  @Get('user/:userId/active')
  async getActiveSessions(@Param('userId') userId: string) {
    return await this.sessionService.getActiveSessions(userId);
  }

  /**
   * GET /sessions/:id - Get session details
   * @param sessionId Session ID
   * @returns Session details with relations
   */
  @Get(':id')
  async getSessionDetails(@Param('id') sessionId: string) {
    return await this.sessionService.getSessionDetails(sessionId);
  }

  /**
   * GET /sessions/:id/actions - Get session actions
   * @param sessionId Session ID
   * @returns Array of actions
   */
  @Get(':id/actions')
  async getSessionActions(@Param('id') sessionId: string) {
    return await this.sessionService.getSessionActions(sessionId);
  }

  /**
   * GET /sessions/:id/stats - Get session statistics
   * @param sessionId Session ID
   * @returns Session statistics
   */
  @Get(':id/stats')
  async getSessionStats(@Param('id') sessionId: string) {
    return await this.sessionService.getSessionStats(sessionId);
  }
}
