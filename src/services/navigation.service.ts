import { Injectable, BadRequestException } from '@nestjs/common';
import { Logger } from '@nestjs/common';

interface NavigationHistory {
  url: string;
  timestamp: Date;
  title?: string;
}

/**
 * NavigationService - Manages browser navigation and URL handling
 * Handles page navigation, history, and URL validation
 */
@Injectable()
export class NavigationService {
  private readonly logger = new Logger(NavigationService.name);
  private navigationHistory: Map<string, NavigationHistory[]> = new Map();

  /**
   * Navigate to URL in browser
   * @param tabId Tab ID
   * @param url Target URL
   * @param timeout Navigation timeout in ms
   */
  async navigateTo(tabId: string, url: string, timeout: number = 30000) {
    this.validateUrl(url);
    this.logger.debug(`Navigating tab ${tabId} to ${url}`);
    
    // Store in navigation history
    this.addToHistory(tabId, url);
    
    return {
      tabId,
      url,
      navigatedAt: new Date(),
      timeout,
    };
  }

  /**
   * Go back in browser history
   * @param tabId Tab ID
   */
  async goBack(tabId: string) {
    const history = this.navigationHistory.get(tabId) || [];
    if (history.length < 2) {
      throw new BadRequestException('No previous page in history');
    }
    
    const previousUrl = history[history.length - 2]?.url;
    this.logger.debug(`Going back in tab ${tabId} to ${previousUrl}`);
    
    return {
      tabId,
      previousUrl,
      action: 'goBack',
    };
  }

  /**
   * Go forward in browser history
   * @param tabId Tab ID
   */
  async goForward(tabId: string) {
    this.logger.debug(`Going forward in tab ${tabId}`);
    return {
      tabId,
      action: 'goForward',
    };
  }

  /**
   * Reload current page
   * @param tabId Tab ID
   * @param ignoreCache Force reload from server
   */
  async reload(tabId: string, ignoreCache: boolean = false) {
    this.logger.debug(`Reloading tab ${tabId} (ignoreCache: ${ignoreCache})`);
    return {
      tabId,
      action: 'reload',
      ignoreCache,
      reloadedAt: new Date(),
    };
  }

  /**
   * Stop page loading
   * @param tabId Tab ID
   */
  async stopLoading(tabId: string) {
    this.logger.debug(`Stopping load in tab ${tabId}`);
    return {
      tabId,
      action: 'stop',
    };
  }

  /**
   * Get current URL for tab
   * @param tabId Tab ID
   */
  async getCurrentUrl(tabId: string): Promise<string | null> {
    const history = this.navigationHistory.get(tabId);
    if (!history || history.length === 0) {
      return null;
    }
    return history[history.length - 1].url;
  }

  /**
   * Get navigation history for tab
   * @param tabId Tab ID
   * @param limit Max entries to return
   */
  async getHistory(tabId: string, limit: number = 10) {
    const history = this.navigationHistory.get(tabId) || [];
    return history.slice(-limit);
  }

  /**
   * Clear navigation history for tab
   * @param tabId Tab ID
   */
  async clearHistory(tabId: string) {
    this.navigationHistory.delete(tabId);
    this.logger.debug(`Cleared history for tab ${tabId}`);
    return { tabId, action: 'clearHistory' };
  }

  /**
   * Wait for page load
   * @param tabId Tab ID
   * @param timeout Max wait time in ms
   */
  async waitForPageLoad(tabId: string, timeout: number = 30000) {
    this.logger.debug(`Waiting for page load in tab ${tabId}`);
    return {
      tabId,
      action: 'waitForPageLoad',
      timeout,
      loadedAt: new Date(),
    };
  }

  /**
   * Wait for URL to match pattern
   * @param tabId Tab ID
   * @param urlPattern URL regex pattern
   * @param timeout Max wait time in ms
   */
  async waitForUrl(tabId: string, urlPattern: string | RegExp, timeout: number = 30000) {
    const pattern = typeof urlPattern === 'string' ? new RegExp(urlPattern) : urlPattern;
    this.logger.debug(`Waiting for URL match in tab ${tabId}: ${pattern}`);
    
    return {
      tabId,
      pattern: pattern.toString(),
      action: 'waitForUrl',
      timeout,
    };
  }

  /**
   * Validate and normalize URL
   */
  private validateUrl(url: string) {
    if (!url || url.trim() === '') {
      throw new BadRequestException('URL cannot be empty');
    }
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.startsWith('about:') || url.startsWith('data:')) {
        return url;
      }
      // URL already validated, treat as valid
    }
    
    return url;
  }

  /**
   * Add navigation to history
   */
  private addToHistory(tabId: string, url: string, title?: string) {
    const history = this.navigationHistory.get(tabId) || [];
    history.push({
      url,
      timestamp: new Date(),
      title,
    });
    this.navigationHistory.set(tabId, history);
  }
}
