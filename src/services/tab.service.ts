import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BrowserTab } from '../entities';

/**
 * TabService - Manages browser tab operations
 * Handles tab lifecycle, state management, and interactions
 */
@Injectable()
export class TabService {
  constructor(
    @InjectRepository(BrowserTab) private tabRepository: Repository<BrowserTab>,
  ) {}

  /**
   * Create new tab in session
   * @param sessionId Session ID
   * @param url Tab URL
   * @returns Created tab
   */
  async createTab(sessionId: string, url: string = 'about:blank') {
    const tab = this.tabRepository.create({
      sessionId,
      url,
      title: 'New Tab',
      status: 'loading',
      isActive: true,
    });
    return await this.tabRepository.save(tab);
  }

  /**
   * Get tab by ID
   * @param tabId Tab ID
   * @returns Tab data
   */
  async getTab(tabId: string) {
    const tab = await this.tabRepository.findOne({ where: { id: tabId } });
    if (!tab) throw new NotFoundException('Tab not found');
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
   * @param status New status (loading, ready, error)
   */
  async updateTabStatus(tabId: string, status: string) {
    const tab = await this.getTab(tabId);
    tab.status = status as any;
    return await this.tabRepository.save(tab);
  }

  /**
   * Update tab URL
   * @param tabId Tab ID
   * @param url New URL
   */
  async updateTabUrl(tabId: string, url: string) {
    const tab = await this.getTab(tabId);
    tab.url = url;
    tab.status = 'loading';
    return await this.tabRepository.save(tab);
  }

  /**
   * Update tab title
   * @param tabId Tab ID
   * @param title New title
   */
  async updateTabTitle(tabId: string, title: string) {
    const tab = await this.getTab(tabId);
    tab.title = title;
    return await this.tabRepository.save(tab);
  }

  /**
   * Close tab
   * @param tabId Tab ID
   */
  async closeTab(tabId: string) {
    const tab = await this.getTab(tabId);
    tab.isActive = false;
    return await this.tabRepository.save(tab);
  }

  /**
   * Set tab as active
   * @param tabId Tab ID
   */
  async setTabActive(tabId: string) {
    const tab = await this.getTab(tabId);
    tab.isActive = true;
    return await this.tabRepository.save(tab);
  }

  /**
   * Deactivate tab
   * @param tabId Tab ID
   */
  async setTabInactive(tabId: string) {
    const tab = await this.getTab(tabId);
    tab.isActive = false;
    return await this.tabRepository.save(tab);
  }

  /**
   * Delete tab
   * @param tabId Tab ID
   */
  async deleteTab(tabId: string) {
    const tab = await this.getTab(tabId);
    return await this.tabRepository.remove(tab);
  }
}
