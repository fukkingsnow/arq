import { Controller, Get, Post, Body, Param, Query, HttpStatus, UseGuards, UseInterceptors } from '@nestjs/common';
import { BrowserService } from '../services/browser.service';
import { TabService } from '../services/tab.service';
import { NavigationService } from '../services/navigation.service';
import { AuthGuard } from '../guards/auth.guard';
import { ValidationPipe } from '../pipes/validation.pipe';
import { BrowserActionDto, NavigateDto, ExecuteScriptDto } from '../dtos';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Browser')
@Controller('api/browser')
@UseGuards(AuthGuard)
@UseInterceptors()
export class BrowserController {
  constructor(
    private readonly browserService: BrowserService,
    private readonly tabService: TabService,
    private readonly navigationService: NavigationService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get browser status' })
  @ApiResponse({ status: 200, description: 'Browser status retrieved' })
  async getBrowserStatus() {
    return this.browserService.getStatus();
  }

  @Post('screenshot')
  @ApiOperation({ summary: 'Capture browser screenshot' })
  @ApiResponse({ status: 201, description: 'Screenshot captured' })
  async takeScreenshot(@Body() dto: BrowserActionDto) {
    if (!dto.tabId) {
      throw new Error('tabId is required');
    }
    return this.browserService.takeScreenshot(dto.tabId);
  }

  @Post('navigate')
  @ApiOperation({ summary: 'Navigate to URL' })
  @ApiResponse({ status: 201, description: 'Navigation successful' })
  async navigate(
    @Body(new ValidationPipe()) dto: NavigateDto,
  ) {
    if (!dto.url || !dto.tabId) {
      throw new Error('url and tabId are required');
    }
    return this.navigationService.navigate(dto.url, dto.tabId);
  }

  @Post('execute')
  @ApiOperation({ summary: 'Execute script in browser' })
  @ApiResponse({ status: 201, description: 'Script executed' })
  async executeScript(
    @Body(new ValidationPipe()) dto: ExecuteScriptDto,
  ) {
    if (!dto.script || !dto.tabId) {
      throw new Error('script and tabId are required');
    }
    return this.browserService.executeScript(dto.script, dto.tabId);
  }

  @Get('tabs')
  @ApiOperation({ summary: 'List all browser tabs' })
  @ApiResponse({ status: 200, description: 'Tabs retrieved' })
  async getTabs() {
    return this.tabService.getAllTabs();
  }

  @Get('tabs/:tabId')
  @ApiOperation({ summary: 'Get specific tab info' })
  @ApiResponse({ status: 200, description: 'Tab info retrieved' })
  async getTab(@Param('tabId') tabId: string) {
    return this.tabService.getTab(tabId);
  }

  @Post('tabs')
  @ApiOperation({ summary: 'Create new tab' })
  @ApiResponse({ status: 201, description: 'Tab created' })
  async createTab(@Body() dto: { url?: string }) {
    return this.tabService.createTab(dto.url || '');
  }

  @Post('tabs/:tabId/close')
  @ApiOperation({ summary: 'Close tab' })
  @ApiResponse({ status: 200, description: 'Tab closed' })
  async closeTab(@Param('tabId') tabId: string) {
    return this.tabService.closeTab(tabId);
  }

  @Post('back')
  @ApiOperation({ summary: 'Navigate back' })
  @ApiResponse({ status: 200, description: 'Navigated back' })
  async goBack(@Body() dto: BrowserActionDto) {
    if (!dto.tabId) {
      throw new Error('tabId is required');
    }
    return this.navigationService.goBack(dto.tabId);
  }

  @Post('forward')
  @ApiOperation({ summary: 'Navigate forward' })
  @ApiResponse({ status: 200, description: 'Navigated forward' })
  async goForward(@Body() dto: BrowserActionDto) {
    if (!dto.tabId) {
      throw new Error('tabId is required');
    }
    return this.navigationService.goForward(dto.tabId);
  }
}
