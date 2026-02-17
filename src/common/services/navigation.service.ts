import { Injectable } from '@nestjs/common';

@Injectable()
export class NavigationService {
  private history: Map<string, any[]> = new Map();

  constructor() {}

  navigate(url: string, tabId: string) {
    if (!this.history.has(tabId)) {
      this.history.set(tabId, []);
    }
    this.history.get(tabId)!.push({ url, timestamp: Date.now() });
    return { success: true, url };
  }

  goBack(tabId: string) {
    const hist = this.history.get(tabId);
    if (hist && hist.length > 1) {
      hist.pop();
      const prev = hist[hist.length - 1];
      return { success: true, url: prev?.url };
    }
    return { success: false, message: 'No history' };
  }

  goForward(tabId: string) {
    return { success: false, message: 'Forward not implemented' };
  }
}
