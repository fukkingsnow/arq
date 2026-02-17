content.js/**
 * ARQ Browser Extension - Content Script
 * 
 * Injected into web pages to:
 * - Capture DOM content for analysis
 * - Enable page interaction automation
 * - Communicate with background service worker
 * - Provide user interface for ARQ features
 */

console.log('[ARQ] Content script loaded');

// Content script initialization
const ARQ_CONTENT = {
  config: {
    autoAnalyze: true,
    captureImages: false,
    captureScripts: false,
    timeout: 30000,
  },

  // Extract page content for analysis
  extractPageContent() {
    return {
      url: window.location.href,
      title: document.title,
      html: document.documentElement.outerHTML.substring(0, 100000),
      text: document.body.innerText.substring(0, 50000),
      meta: {
        viewport: document.querySelector('meta[name="viewport"]')?.content,
        description: document.querySelector('meta[name="description"]')?.content,
        charset: document.querySelector('meta[charset]')?.charset,
      },
      links: Array.from(document.querySelectorAll('a')).map(a => ({
        href: a.href,
        text: a.textContent.trim().substring(0, 100),
      })).slice(0, 50),
      images: document.querySelectorAll('img').length,
      forms: document.querySelectorAll('form').length,
      elements: {
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        tables: document.querySelectorAll('table').length,
      },
    };
  },

  // Find element by selector and interact
  findAndClick(selector) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        element.click();
        return { success: true, message: `Clicked: ${selector}` };
      }
      return { success: false, message: `Element not found: ${selector}` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Fill form field
  fillInput(selector, value) {
    try {
      const element = document.querySelector(selector);
      if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
        element.focus();
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return { success: true, message: `Filled: ${selector}` };
      }
      return { success: false, message: `Input not found: ${selector}` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Extract form data
  extractFormData(formSelector) {
    try {
      const form = document.querySelector(formSelector);
      if (!form) return { success: false, message: 'Form not found' };

      const formData = new FormData(form);
      const data = {};
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Scroll to element
  scrollToElement(selector) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return { success: true };
      }
      return { success: false, message: 'Element not found' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Highlight element
  highlightElement(selector) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        element.style.outline = '3px solid #00ff00';
        element.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.5)';
        setTimeout(() => {
          element.style.outline = '';
          element.style.boxShadow = '';
        }, 2000);
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Get all clickable elements
  getClickableElements() {
    const clickables = document.querySelectorAll('button, a, [role="button"], [onclick]');
    return Array.from(clickables).map((el, idx) => ({
      id: idx,
      tag: el.tagName,
      text: el.textContent.trim().substring(0, 50),
      selector: this.getSelector(el),
    })).slice(0, 100);
  },

  // Generate CSS selector
  getSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    const path = [];
    while (element.parentElement) {
      let selector = element.tagName.toLowerCase();
      if (element.id) {
        selector += `#${element.id}`;
        path.unshift(selector);
        break;
      }
      path.unshift(selector);
      element = element.parentElement;
    }
    return path.join(' > ');
  },
};

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[ARQ] Message received:', request.action);
  try {
    switch (request.action) {
      case 'ping':
        sendResponse({ pong: true });
        break;
      case 'analyze_page':
        const content = ARQ_CONTENT.extractPageContent();
        sendResponse({ success: true, content });
        break;
      case 'click_element':
        const clickResult = ARQ_CONTENT.findAndClick(request.selector);
        sendResponse(clickResult);
        break;
      case 'fill_input':
        const fillResult = ARQ_CONTENT.fillInput(request.selector, request.value);
        sendResponse(fillResult);
        break;
      case 'extract_form':
        const formResult = ARQ_CONTENT.extractFormData(request.selector);
        sendResponse(formResult);
        break;
      case 'scroll_to':
        const scrollResult = ARQ_CONTENT.scrollToElement(request.selector);
        sendResponse(scrollResult);
        break;
      case 'highlight':
        const highlightResult = ARQ_CONTENT.highlightElement(request.selector);
        sendResponse(highlightResult);
        break;
      case 'get_clickables':
        const clickables = ARQ_CONTENT.getClickableElements();
        sendResponse({ success: true, clickables });
        break;
      default:
        sendResponse({ error: 'Unknown action' });
    }
  } catch (error) {
    sendResponse({ error: error.message });
  }
  return true;
});

console.log('[ARQ] Content script ready');
