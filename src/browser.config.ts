/**
 * Puppeteer Browser Configuration
 * Default settings for browser launch across all instances
 */

export const BROWSER_CONFIG = {
  // Chrome/Chromium launch options
  chrome: {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--window-size=1920,1080',
    ],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    timeout: 30000,
  },

  // Firefox launch options
  firefox: {
    headless: true,
    args: [],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    timeout: 30000,
  },

  // WebKit launch options
  webkit: {
    headless: true,
    args: [],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    timeout: 30000,
  },
};

// Page navigation timeout
export const PAGE_TIMEOUT = 30000; // 30 seconds

// Default wait options
export const WAIT_OPTIONS = {
  timeout: 30000,
  waitUntil: 'networkidle0' as const,
};

// Browser pool configuration
export const BROWSER_POOL_CONFIG = {
  max: 5, // Maximum browser instances
  min: 1, // Minimum browser instances
  idleTimeoutMillis: 300000, // 5 minutes
  connectionTimeoutMillis: 10000, // 10 seconds
};

// Session cleanup
export const SESSION_CONFIG = {
  maxSessionDuration: 3600000, // 1 hour
  sessionCheckInterval: 60000, // Check every minute
  inactivityTimeout: 600000, // 10 minutes of inactivity
};
