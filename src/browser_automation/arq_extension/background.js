/**
 * ARQ Browser Extension - Background Service Worker
 * 
 * Handles:
 * - Extension lifecycle management
 * - Message routing between content scripts and ARQ backend
 * - Tab management and monitoring
 * - Context menu integration
 * - Storage synchronization
 */

// Service worker for background operations
console.log('ARQ Extension Background Service Worker initialized');

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('ARQ Extension installed');
    // Open welcome page
    chrome.tabs.create({ url: 'welcome.html' });
  } else if (details.reason === 'update') {
    console.log('ARQ Extension updated');
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);
  
  if (request.action === 'analyze_page') {
    analyzePageContent(request.data, sender.tab).then(result => {
      sendResponse({ success: true, data: result });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'get_config') {
    chrome.storage.sync.get(['arq_config'], (result) => {
      sendResponse(result.arq_config || {});
    });
    return true;
  }
  
  if (request.action === 'save_config') {
    chrome.storage.sync.set({ arq_config: request.config }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Add context menu items
chrome.contextMenus.create({
  id: 'arq-analyze',
  title: 'Analyze with ARQ',
  contexts: ['page', 'selection'],
});

chrome.contextMenus.create({
  id: 'arq-automate',
  title: 'Automate with ARQ',
  contexts: ['page'],
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'arq-analyze') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'analyze_selection',
      text: info.selectionText || ''
    });
  } else if (info.menuItemId === 'arq-automate') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'start_automation',
      url: tab.url
    });
  }
});

// Monitor tab changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab loaded:', tab.url);
    // Inject content script if needed
    chrome.tabs.sendMessage(tabId, {
      action: 'ping'
    }).catch(() => {
      // Content script not loaded, inject it
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
    });
  }
});

/**
 * Analyze page content using ARQ
 */
async function analyzePageContent(data, tab) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['arq_api_endpoint'], (result) => {
      const endpoint = result.arq_api_endpoint || 'http://localhost:8000';
      
      fetch(`${endpoint}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: tab.url,
          content: data,
          timestamp: new Date().toISOString()
        })
      })
      .then(response => response.json())
      .then(result => resolve(result))
      .catch(error => reject(error));
    });
  });
}

/**
 * Update extension status
 */
function updateStatus(status) {
  chrome.action.setBadgeText({ text: status });
  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
}

// Set initial status
updateStatus('Ready');
