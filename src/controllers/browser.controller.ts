import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { BrowserService } from '../services';
import { NavigationService, DOMService } from '../services';
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
  constructor(
    private readonly browserService: BrowserService,
    private readonly navigationService: NavigationService,
    private readonly domService: DOMService,
  ) {}
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

    // Navigation endpoints

  /**
   * Navigate to URL
   */
  @Post(':sessionId/navigate')
  @HttpCode(HttpStatus.OK)
  async navigate(
    @Param('sessionId') sessionId: string,
    @Body() data: { url: string; timeout?: number },
  ) {
    return await this.navigationService.navigateTo(sessionId, data.url, data.timeout);
  }

  /**
   * DOM interaction - Click element
   */
  @Post(':sessionId/click')
  @HttpCode(HttpStatus.OK)
  async click(
    @Param('sessionId') sessionId: string,
    @Body() data: { selector: string; selectorType?: 'css' | 'xpath' | 'text' },
  ) {
    return await this.domService.click(sessionId, data.selector, data.selectorType);
  }

  /**
   * DOM interaction - Type text
   */
  @Post(':sessionId/type')
  @HttpCode(HttpStatus.OK)
  async type(
    @Param('sessionId') sessionId: string,
    @Body() data: { selector: string; text: string; clearFirst?: boolean },
  ) {
    return await this.domService.type(sessionId, data.selector, data.text, data.clearFirst);
  }

  /**
   * Take screenshot
   */
  @Post(':sessionId/screenshot')
  @HttpCode(HttpStatus.OK)
  async takeScreenshot(
    @Param('sessionId') sessionId: string,
    @Body() data: { fullPage?: boolean } = {},
  ) {
    return await this.domService.takeScreenshot(sessionId, data.fullPage);
  }
}
