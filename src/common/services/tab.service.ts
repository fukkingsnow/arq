import { Injectable } from '@nestjs/common';

@Injectable()
export class TabService {
  private tabs: Map<string, any> = new Map();
  private tabId = 0;

  constructor() {}

  getAllTabs() {
    return Array.from(this.tabs.values());
  }

  getTab(tabId: string) {
    return this.tabs.get(tabId);
  }

  createTab(url: string) {
    const id = `tab-${++this.tabId}`;
    this.tabs.set(id, { id, url, status: 'active' });
    return this.tabs.get(id);
  }

  closeTab(tabId: string) {
    this.tabs.delete(tabId);
    return { success: true };
  }
}
