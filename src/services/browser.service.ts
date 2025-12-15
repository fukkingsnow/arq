import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BrowserSession, BrowserTab } from '../entities';

/**
 * BrowserService - Manages browser session and tab operations
 * Handles session creation, tab management, and state tracking
 */
@Injectable()
export class BrowserService {
  constructor(
    @InjectRepository(BrowserSession) private sessionRepository: Repository<BrowserSession>,
    @InjectRepository(BrowserTab) private tabRepository: Repository<BrowserTab>,
  ) {}

  /**
   * Create new browser session
   * @param userId User ID
   * @returns Created session
   */
  async createSession(userId: string) {
    const session = this.sessionRepository.create({
          sessionId: require('uuid').v4(),
      userId,
      status: 'active',
      tabCount: 0,
    });
    return await this.sessionRepository.save(session);
  }

  /**
   * Get session by ID
   * @param sessionId Session ID
   * @returns Session data
   */
  async getSession(sessionId: string) {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  /**
   * Close browser session
   * @param sessionId Session ID
   */
  async closeSession(sessionId: string) {
    const session = await this.getSession(sessionId);
    session.status = 'closed';
    session.endedAt = new Date();
    return await this.sessionRepository.save(session);
  }

  /**
   * Create new tab in session
   * @param sessionId Session ID
   * @param url Tab URL
   * @returns Created tab
   */
  async createTab(sessionId: string, url: string) {
    const session = await this.getSession(sessionId);
    const tab = this.tabRepository.create({
      sessionId,
      url,
      title: 'New Tab',
      status: 'loading',
      isActive: true,
    });
    await this.tabRepository.save(tab);
    session.tabCount = (session.tabCount || 0) + 1;
    await this.sessionRepository.save(session);
    return tab;
  }

  /**
   * Get all tabs in session
   * @param sessionId Session ID
   * @returns Array of tabs
   */
  async getSessionTabs(sessionId: string) {
    return await this.tabRepository.find({ where: { sessionId } });
  }

  /**
   * Update tab status
   * @param tabId Tab ID
   * @param status New status
   */
  async updateTabStatus(tabId: string, status: string) {
    const tab = await this.tabRepository.findOne({ where: { id: tabId } });
    if (!tab) throw new NotFoundException('Tab not found');
    tab.status = status as any;
    return await this.tabRepository.save(tab);
      }
    
  /**
   * Get tab data
   * @param sessionId Session ID
   * @param tabId Tab ID
   * @returns Tab data
   */
  async getTab(sessionId: string, tabId: string) {
    const tab = await this.tabRepository.findOne({
      where: { id: tabId, sessionId },
    });
    if (!tab) throw new NotFoundException('Tab not found');
    return tab;
  }

  /**
   * Close tab in session
   * @param sessionId Session ID
   * @param tabId Tab ID
   * @returns Closed tab
   */
  async closeTab(sessionId: string, tabId: string) {
    const tab = await this.getTab(sessionId, tabId);
    tab.status = 'complete';
        return await this.tabRepository.save(tab);
  }
  }

