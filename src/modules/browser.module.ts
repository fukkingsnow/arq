import { Module } from '@nestjs/common';
import { BrowserController } from '../controllers/browser.controller';
import { BrowserService } from '../services/browser.service';

/**
 * Browser Automation Feature Module
 *
 * Provides browser session management and tab automation.
 * - Session lifecycle management (create, update, close)
 * - Tab management (open, close, navigate, execute scripts)
 * - Screenshot and recording capabilities
 * - Integration with Selenium/WebDriver
 *
 * @module src/modules/browser.module
 */
@Module({
  controllers: [BrowserController],
  providers: [BrowserService],
  exports: [BrowserService],
})
export class BrowserModule {}
