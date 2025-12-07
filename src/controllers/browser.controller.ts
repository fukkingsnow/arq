import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { BrowserService } from '../services';

interface CreateSessionDto {
  userId: string;
}

interface CreateTabDto {
  url: string;
}

/**
 * BrowserController - Handles browser session and tab endpoints
 * Manages browser automation session operations
 */
@Controller('browser')
export class BrowserController {
  constructor(private readonly browserService: BrowserService) {}

  /**
   * POST /browser/sessions - Create new browser session
   * @param dto Session creation data
   * @returns Created session
   */
  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  async createSession(@Body() dto: CreateSessionDto) {
    return await this.browserService.createSession(dto.userId);
  }

  /**
   * GET /browser/sessions/:id - Get session by ID
   * @param sessionId Session ID
   * @returns Session data
   */
  @Get('sessions/:id')
  async getSession(@Param('id') sessionId: string) {
    return await this.browserService.getSession(sessionId);
  }

  /**
   * POST /browser/sessions/:id/close - Close session
   * @param sessionId Session ID
   */
  @Post('sessions/:id/close')
  @HttpCode(HttpStatus.OK)
  async closeSession(@Param('id') sessionId: string) {
    return await this.browserService.closeSession(sessionId);
  }

  /**
   * POST /browser/sessions/:id/tabs - Create new tab
   * @param sessionId Session ID
   * @param dto Tab creation data
   * @returns Created tab
   */
  @Post('sessions/:id/tabs')
  @HttpCode(HttpStatus.CREATED)
  async createTab(@Param('id') sessionId: string, @Body() dto: CreateTabDto) {
    return await this.browserService.createTab(sessionId, dto.url);
  }

  /**
   * GET /browser/sessions/:id/tabs - Get session tabs
   * @param sessionId Session ID
   * @returns Array of tabs
   */
  @Get('sessions/:id/tabs')
  async getSessionTabs(@Param('id') sessionId: string) {
    return await this.browserService.getSessionTabs(sessionId);
  }
}
