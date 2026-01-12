ai-response.service.tsimport { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

@Injectable()
export class AiResponseService extends EventEmitter {
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private responseHandlers = new Map();

  async processUserQuery(userId: string, query: string): Promise<string> {
    try {
      this.conversationHistory.push({
        role: 'user',
        content: query
      });

      const response = await this.generateAiResponse(query);
      
      this.conversationHistory.push({
        role: 'assistant',
        content: response
      });

      this.emit('response:generated', { userId, response, timestamp: new Date() });
      return response;
    } catch (error) {
      this.emit('response:error', { userId, error: error.message });
      throw error;
    }
  }

  private async generateAiResponse(query: string): Promise<string> {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('task') || lowerQuery.includes('завтра')) {
      return 'I can help you manage tasks. Please specify what you would like to do with your tasks.';
    }
    if (lowerQuery.includes('history') || lowerQuery.includes('история')) {
      return 'Here is your task history and recent activities.';
    }
    if (lowerQuery.includes('status') || lowerQuery.includes('статус')) {
      return 'Your current system status is healthy. All modules are running properly.';
    }
    
    return 'I am ARQ AI Assistant. I can help you with task management, workflow automation, and system analysis. How can I assist you?';
  }

  getConversationHistory(): Array<{ role: string; content: string }> {
    return this.conversationHistory;
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  registerResponseHandler(key: string, handler: Function): void {
    this.responseHandlers.set(key, handler);
  }

  getResponseHandler(key: string): Function | undefined {
    return this.responseHandlers.get(key);
  }
}
