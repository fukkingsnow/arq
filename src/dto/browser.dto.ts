import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum } from 'class-validator';

/**
 * Browser initialization and control data transfer object
 * Handles browser instance creation, configuration, and session management
 */
export class CreateBrowserDto {
  /**
   * Unique browser instance identifier
   * @example 'browser-session-abc123'
   */
  @IsString()
  instanceId: string;

  /**
   * Browser type/engine
   * @example 'chromium' | 'firefox' | 'webkit'
   */
  @IsEnum(['chromium', 'firefox', 'webkit'])
  browserType: 'chromium' | 'firefox' | 'webkit';

  /**
   * Enable headless mode for automation
   * @default true
   */
  @IsBoolean()
  @IsOptional()
  headless?: boolean = true;

  /**
   * Viewport width in pixels
   * @default 1920
   */
  @IsNumber()
  @IsOptional()
  viewportWidth?: number = 1920;

  /**
   * Viewport height in pixels
   * @default 1080
   */
  @IsNumber()
  @IsOptional()
  viewportHeight?: number = 1080;

  /**
   * User agent string for HTTP requests
   * @optional
   */
  @IsString()
  @IsOptional()
  userAgent?: string;

  /**
   * Timeout for browser operations in milliseconds
   * @default 30000
   */
  @IsNumber()
  @IsOptional()
  timeout?: number = 30000;

  /**
   * Enable JavaScript execution
   * @default true
   */
  @IsBoolean()
  @IsOptional()
  enableJavaScript?: boolean = true;

  /**
   * Additional browser launch arguments
   * @example ['--disable-blink-features=AutomationControlled']
   */
  @IsArray()
  @IsOptional()
  launchArgs?: string[];
}

/**
 * Browser tab/page management DTO
 * Handles tab creation, switching, and navigation
 */
export class BrowserTabDto {
  /**
   * Unique tab identifier
   * @example 'tab-xyz789'
   */
  @IsString()
  tabId: string;

  /**
   * Current page URL
   * @example 'https://example.com'
   */
  @IsString()
  url: string;

  /**
   * Page title
   * @example 'Example Domain'
   */
  @IsString()
  @IsOptional()
  title?: string;

  /**
   * Tab/window handle identifier
   * @optional
   */
  @IsString()
  @IsOptional()
  handle?: string;

  /**
   * Tab creation timestamp (Unix milliseconds)
   * @example 1733571600000
   */
  @IsNumber()
  createdAt: number;
}

/**
 * Browser navigation request DTO
 * Manages URL navigation and page load strategies
 */
export class NavigateDto {
  /**
   * URL to navigate to
   * @example 'https://example.com/page'
   */
  @IsString()
  url: string;

  /**
   * Tab identifier for navigation
   * @example 'tab-xyz789'
   */
  @IsString()
  tabId: string;

  /**
   * Wait until strategy for page load
   * @enum 'load' | 'domcontentloaded' | 'networkidle'
   * @default 'networkidle'
   */
  @IsEnum(['load', 'domcontentloaded', 'networkidle'])
  @IsOptional()
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle';

  /**
   * Navigation timeout in milliseconds
   * @default 30000
   */
  @IsNumber()
  @IsOptional()
  timeout?: number = 30000;

  /**
   * Referrer URL for the request
   * @optional
   */
  @IsString()
  @IsOptional()
  referer?: string;
}

/**
 * Browser action execution DTO
 * Handles clicks, text input, and element interactions
 */
export class ActionDto {
  /**
   * Action type identifier
   * @enum 'click' | 'type' | 'hover' | 'scroll' | 'screenshot'
   */
  @IsEnum(['click', 'type', 'hover', 'scroll', 'screenshot', 'waitFor'])
  actionType: 'click' | 'type' | 'hover' | 'scroll' | 'screenshot' | 'waitFor';

  /**
   * Tab identifier for action execution
   * @example 'tab-xyz789'
   */
  @IsString()
  tabId: string;

  /**
   * CSS selector or XPath for element targeting
   * @example '#submit-button'
   */
  @IsString()
  selector?: string;

  /**
   * Text input for type actions
   * @example 'password123'
   */
  @IsString()
  @IsOptional()
  text?: string;

  /**
   * Scroll direction and amount
   * @example { direction: 'down', amount: 500 }
   */
  @IsOptional()
  scrollConfig?: {
    direction: 'up' | 'down' | 'left' | 'right';
    amount: number;
  };

  /**
   * Action execution timeout in milliseconds
   * @default 10000
   */
  @IsNumber()
  @IsOptional()
  timeout?: number = 10000;
}

/**
 * Browser session state DTO
 * Represents current browser and tab state information
 */
export class BrowserStateDto {
  /**
   * Browser instance identifier
   * @example 'browser-session-abc123'
   */
  @IsString()
  instanceId: string;

  /**
   * Active tab ID
   * @example 'tab-xyz789'
   */
  @IsString()
  activeTabId: string;

  /**
   * All open tabs in browser
   */
  @IsArray()
  @IsOptional()
  tabs?: BrowserTabDto[];

  /**
   * Browser connection status
   * @default true
   */
  @IsBoolean()
  @IsOptional()
  isConnected?: boolean = true;

  /**
   * Session creation timestamp
   * @example 1733571600000
   */
  @IsNumber()
  createdAt: number;

  /**
   * Last activity timestamp
   * @example 1733571700000
   */
  @IsNumber()
  lastActivityAt: number;
}
