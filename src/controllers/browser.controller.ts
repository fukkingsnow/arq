import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { BrowserService } from '../services';
import { CreateSessionDto } from '../dtos';

interface CreateTabDto {
  uri: string;
}

/**
 * BrowserController - Handles browser session and tab endpoints
 * Manages browser automation session operations
 */
@Controller('browser')
export class BrowserController {
  constructor(private readonly browserService: BrowserService) {}

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  async createSession(@Body() dto: CreateSessionDto) {
    return await this.browserService.createSession(dto.userId);
  }

  @Get('sessions/:id')
  @HttpCode(HttpStatus.OK)
  async getSession(@Param('id') sessionId: string) {
    return await this.browserService.getSession(sessionId);
  }

  @Post('sessions/:id/close')
  @HttpCode(HttpStatus.OK)
  async closeSession(@Param('id') sessionId: string) {
    return await this.browserService.closeSession(sessionId);
  }

  @Post('sessions/:id/tabs')
  @HttpCode(HttpStatus.CREATED)
  async createTab(@Param('id') sessionId: string, @Body() dto: CreateTabDto) {
    return await this.browserService.createTab(sessionId, dto.uri);
  }

  @Get('sessions/:sessionId/tabs/:tabId')
  @HttpCode(HttpStatus.OK)
  async getTab(@Param('sessionId') sessionId: string, @Param('tabId') tabId: string) {
    return await this.browserService.getTab(sessionId, tabId);
  }

  @Post('sessions/:sessionId/tabs/:tabId/close')
  @HttpCode(HttpStatus.OK)
  async closeTab(@Param('sessionId') sessionId: string, @Param('tabId') tabId: string) {
    return await this.browserService.closeTab(sessionId, tabId);
  }
}
