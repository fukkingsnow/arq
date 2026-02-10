// AI Assistant Chat Interface
class AIChatService {
  static messagesContainer = null;
  static inputElement = null;
  static wsConnected = false;

  static init(containerId, inputId) {
    this.messagesContainer = document.getElementById(containerId);
    this.inputElement = document.getElementById(inputId);
    
    if (!this.messagesContainer || !this.inputElement) {
      console.error('[AI Chat] Required elements not found');
      return;
    }

    this.inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Monitor WebSocket connection
    TaskWebSocketService.on('aiResponse', (data) => {
      this.displayMessage('ai', data.message, true);
    });

    console.log('[AI Chat] Initialized');
  }

  static sendMessage() {
    const text = this.inputElement.value.trim();
    if (!text) return;

    this.displayMessage('user', text);
    this.inputElement.value = '';
    this.inputElement.focus();

    const taskContext = {
      currentTasks: appState.tasks,
      taskCount: appState.tasks.length,
      timestamp: new Date().toISOString()
    };

    if (TaskWebSocketService.isConnected()) {
      TaskWebSocketService.send('aiQuery', {
        message: text,
        context: taskContext
      });
    } else {
      this.displayMessage('ai', 'WebSocket disconnected. Using fallback API...', false);
      this.sendViaAPI(text, taskContext);
    }
  }

  static async sendViaAPI(message, context) {
    try {
      const response = await fetch(`${API_BASE}/ai/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      this.displayMessage('ai', data.response, true);
    } catch (error) {
      this.displayMessage('ai', `Error: ${error.message}`, false);
    }
  }

  static displayMessage(sender, text, isStreaming = false) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}`;
    messageEl.innerHTML = `
      <div class="message-sender">${sender === 'user' ? '👤 You' : '🤖 AI'}</div>
      <div class="message-content">${this.escapeHtml(text)}</div>
      ${isStreaming ? '<div class="message-streaming">●</div>' : ''}
    `;
    this.messagesContainer.appendChild(messageEl);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize AI Chat when DOM is ready
function initAIChat() {
  try {
    AIChatService.init('aiMessagesContainer', 'aiInput');
  } catch (err) {
    console.warn('[AI Chat] Initialization skipped (not available)');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAIChat);
} else {
  initAIChat();
}
