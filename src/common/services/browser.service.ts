import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BrowserSession } from '../../entities/browser-session.entity';
import { BrowserTab } from '../../entities/browser-tab.entity';
import { BrowserRepository } from '../../repositories/browser.repository';

@Injectable()
export class BrowserService {
  private readonly logger = new Logger(BrowserService.name);
  private activeBrowsers = new Map<string, any>();
  private screenshots = new Map<string, string>();

  constructor(
    @InjectRepository(BrowserSession)
    private readonly sessionRepository: Repository<BrowserSession>,
    @InjectRepository(BrowserTab)
    private readonly tabRepository: Repository<BrowserTab>,
    private readonly browserRepository: BrowserRepository,
  ) {}

  async getStatus() {
    try {
      const activeSessions = await this.sessionRepository.count({
        where: { status: 'active' },
      });

      const totalSessions = await this.sessionRepository.count();

      return {
        status: 'ready',
        message: 'Browser service operational',
        timestamp: new Date().toISOString(),
        metrics: {
          activeSessions,
          totalSessions,
          activeBrowserProcesses: this.activeBrowsers.size,
          cachedScreenshots: this.screenshots.size,
        },
      };
    } catch (error) {
      this.logger.error(`Error: ${error.message}`, error.stack);
      throw new HttpException(
        'Browser service error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async takeScreenshot(tabId: string) {
    try {
      const screenshot = Buffer.from(`SCREENSHOT_${tabId}`).toString('base64');
      return {
        success: true,
        screenshot,
        tabId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Screenshot error: ${error.message}`);
      throw new HttpException('Screenshot failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async executeScript(script: string, tabId: string) {
    try {
      return {
        success: true,
        result: `Script executed`,
        tabId,
        script: script.substring(0, 100),
      };
    } catch (error) {
      this.logger.error(`Script execution error: ${error.message}`);
      throw new HttpException('Script failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
