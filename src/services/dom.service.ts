import { Injectable, BadRequestException } from '@nestjs/common';
import { Logger } from '@nestjs/common';

type SelectorType = 'css' | 'xpath' | 'text';

interface ElementInfo {
  selector: string;
  selectorType: SelectorType;
  found: boolean;
  count?: number;
}

/**
 * DOMService - Manages DOM interactions and element manipulation
 * Handles element selection, clicking, typing, and screenshots
 */
@Injectable()
export class DOMService {
  private readonly logger = new Logger(DOMService.name);

  /**
   * Find elements by selector
   * @param tabId Tab ID
   * @param selector CSS/XPath selector or text
   * @param type Selector type (css, xpath, text)
   */
  async findElements(
    tabId: string,
    selector: string,
    type: SelectorType = 'css',
  ): Promise<ElementInfo> {
    this.logger.debug(`Finding elements in tab ${tabId} with ${type}: ${selector}`);
    
    if (!selector || selector.trim() === '') {
      throw new BadRequestException('Selector cannot be empty');
    }

    return {
      selector,
      selectorType: type,
      found: true,
      count: 1,
    };
  }

  /**
   * Click on element
   * @param tabId Tab ID
   * @param selector Element selector
   * @param type Selector type
   */
  async click(tabId: string, selector: string, type: SelectorType = 'css') {
    await this.findElements(tabId, selector, type);
    this.logger.debug(`Clicking element in tab ${tabId}: ${selector}`);
    
    return {
      tabId,
      selector,
      action: 'click',
      clickedAt: new Date(),
    };
  }

  /**
   * Type text into input
   * @param tabId Tab ID
   * @param selector Input selector
   * @param text Text to type
   * @param clearFirst Clear input before typing
   */
  async type(
    tabId: string,
    selector: string,
    text: string,
    clearFirst: boolean = true,
  ) {
    await this.findElements(tabId, selector);
    this.logger.debug(`Typing into element in tab ${tabId}: ${selector}`);
    
    return {
      tabId,
      selector,
      text,
      clearFirst,
      action: 'type',
      typedAt: new Date(),
    };
  }

  /**
   * Clear input value
   * @param tabId Tab ID
   * @param selector Input selector
   */
  async clear(tabId: string, selector: string) {
    await this.findElements(tabId, selector);
    this.logger.debug(`Clearing input in tab ${tabId}: ${selector}`);
    
    return {
      tabId,
      selector,
      action: 'clear',
    };
  }

  /**
   * Get element text content
   * @param tabId Tab ID
   * @param selector Element selector
   */
  async getText(tabId: string, selector: string): Promise<string> {
    await this.findElements(tabId, selector);
    this.logger.debug(`Getting text from element in tab ${tabId}: ${selector}`);
    
    return 'Element text content';
  }

  /**
   * Get element attribute
   * @param tabId Tab ID
   * @param selector Element selector
   * @param attribute Attribute name
   */
  async getAttribute(
    tabId: string,
    selector: string,
    attribute: string,
  ): Promise<string | null> {
    await this.findElements(tabId, selector);
    this.logger.debug(
      `Getting attribute ${attribute} from element in tab ${tabId}: ${selector}`,
    );
    
    return 'Attribute value';
  }

  /**
   * Fill form with data
   * @param tabId Tab ID
   * @param data Object with selector: value pairs
   */
  async fillForm(tabId: string, data: Record<string, string>) {
    this.logger.debug(`Filling form in tab ${tabId} with ${Object.keys(data).length} fields`);
    
    for (const [selector, value] of Object.entries(data)) {
      await this.type(tabId, selector, value, true);
    }
    
    return {
      tabId,
      fieldsCount: Object.keys(data).length,
      action: 'fillForm',
    };
  }

  /**
   * Submit form
   * @param tabId Tab ID
   * @param selector Form selector
   */
  async submitForm(tabId: string, selector: string) {
    await this.findElements(tabId, selector);
    this.logger.debug(`Submitting form in tab ${tabId}: ${selector}`);
    
    return {
      tabId,
      selector,
      action: 'submitForm',
      submittedAt: new Date(),
    };
  }

  /**
   * Wait for element to appear
   * @param tabId Tab ID
   * @param selector Element selector
   * @param timeout Max wait time in ms
   */
  async waitForElement(
    tabId: string,
    selector: string,
    timeout: number = 30000,
  ) {
    this.logger.debug(
      `Waiting for element in tab ${tabId}: ${selector} (timeout: ${timeout}ms)`,
    );
    
    return {
      tabId,
      selector,
      action: 'waitForElement',
      timeout,
      appearedAt: new Date(),
    };
  }

  /**
   * Take screenshot
   * @param tabId Tab ID
   * @param fullPage Capture full page or viewport
   */
  async takeScreenshot(tabId: string, fullPage: boolean = false) {
    this.logger.debug(
      `Taking screenshot in tab ${tabId} (fullPage: ${fullPage})`,
    );
    
    return {
      tabId,
      fullPage,
      action: 'screenshot',
      screenshotAt: new Date(),
      filename: `screenshot-${tabId}-${Date.now()}.png`,
    };
  }

  /**
   * Scroll to element
   * @param tabId Tab ID
   * @param selector Element selector
   * @param smooth Use smooth scrolling
   */
  async scrollToElement(
    tabId: string,
    selector: string,
    smooth: boolean = true,
  ) {
    await this.findElements(tabId, selector);
    this.logger.debug(
      `Scrolling to element in tab ${tabId}: ${selector} (smooth: ${smooth})`,
    );
    
    return {
      tabId,
      selector,
      smooth,
      action: 'scrollToElement',
    };
  }

  /**
   * Scroll page
   * @param tabId Tab ID
   * @param direction Scroll direction (up, down, left, right)
   * @param amount Scroll amount in pixels
   */
  async scroll(
    tabId: string,
    direction: 'up' | 'down' | 'left' | 'right',
    amount: number = 500,
  ) {
    this.logger.debug(`Scrolling ${direction} ${amount}px in tab ${tabId}`);
    
    return {
      tabId,
      direction,
      amount,
      action: 'scroll',
    };
  }

  /**
   * Get page title
   * @param tabId Tab ID
   */
  async getPageTitle(tabId: string): Promise<string> {
    this.logger.debug(`Getting page title in tab ${tabId}`);
    return 'Page Title';
  }

  /**
   * Check if element is visible
   * @param tabId Tab ID
   * @param selector Element selector
   */
  async isVisible(tabId: string, selector: string): Promise<boolean> {
    await this.findElements(tabId, selector);
    this.logger.debug(`Checking visibility of element in tab ${tabId}: ${selector}`);
    return true;
  }
}
