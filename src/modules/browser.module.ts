import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrowserSession, BrowserTab } from '../entities';
import { BrowserController } from '../controllers/browser.controller';
import { BrowserService } from '../services/browser.service';
import { BrowserRepository, SessionRepository } from '../repositories';
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
    imports: [TypeOrmModule.forFeature([BrowserSession, BrowserTab])],
  controllers: [BrowserController],
  providers: [BrowserService, BrowserRepository, SessionRepository],})
export class BrowserModule {}
