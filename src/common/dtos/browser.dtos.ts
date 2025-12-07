/**
 * Browser-related Data Transfer Objects
 * Defines request/response contracts for browser operations
 */

/**
 * DTO for browser actions that require a tab ID
 * Used for operations like screenshot, navigation
 */
export class BrowserActionDto {
  /**
   * The tab identifier for the browser action
   */
  tabId: string;
}

/**
 * DTO for navigation operations
 * Specifies both URL and target tab
 */
export class NavigateDto {
  /**
   * The URL to navigate to
   */
  url: string;

  /**
   * The tab identifier where navigation occurs
   */
  tabId: string;
}

/**
 * DTO for executing JavaScript in the browser
 * Contains the script and target tab
 */
export class ExecuteScriptDto {
  /**
   * JavaScript code to execute
   */
  script: string;

  /**
   * The tab identifier where script executes
   */
  tabId: string;
}
