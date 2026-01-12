import { Controller, Post, Body } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket } from 'socket.io';

interface AIQueryRequest {
  message: string;
  context: {
    currentTasks: any[];
    taskCount: number;
    timestamp: string;
  };
}

interface AIResponse {
  response: string;
  taskSuggestions?: string[];
  executedAt: string;
}

@Controller('api/v1/arq/ai')
@WebSocketGateway({ namespace: 'api/v1/arq' })
export class AIController {
  @WebSocketServer() server;

  @Post('query')
  async handleAIQuery(@Body() req: AIQueryRequest): Promise<AIResponse> {
    return this.processAIQuery(req);
  }

  @SubscribeMessage('aiQuery')
  async handleWebSocketAIQuery(
    @MessageBody() req: AIQueryRequest,
    @ConnectedSocket() client: Socket
  ) {
    const response = await this.processAIQuery(req);
    client.emit('aiResponse', response);
  }

  private async processAIQuery(req: AIQueryRequest): Promise<AIResponse> {
    try {
      const { message, context } = req;
      
      // AI Logic: analyze message + task context
      const analysis = await this.analyzeUserMessage(message, context);
      
      // Generate response
      const response = `I analyzed your request: "${message}". You have ${context.taskCount} active tasks. Based on context, I suggest: ${analysis.suggestions.join(', ')}`;
      
      return {
        response,
        taskSuggestions: analysis.suggestions,
        executedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[AI] Query error:', error);
      return {
        response: 'Error processing your request',
        executedAt: new Date().toISOString()
      };
    }
  }

  private async analyzeUserMessage(message: string, context: any): Promise<any> {
    // Simple keyword analysis for now
    const keywords = message.toLowerCase().split(' ');
    const suggestions = [];

    if (keywords.includes('complete') || keywords.includes('finish')) {
      suggestions.push('Mark tasks as completed');
    }
    if (keywords.includes('create') || keywords.includes('new')) {
      suggestions.push('Create new task');
    }
    if (keywords.includes('list') || keywords.includes('show')) {
      suggestions.push('Display all tasks');
    }
    if (keywords.includes('priority')) {
      suggestions.push('Sort by priority');
    }
    if (keywords.includes('help') || keywords.includes('status')) {
      suggestions.push(`Current status: ${context.taskCount} tasks`);
    }

    if (suggestions.length === 0) {
      suggestions.push('Continue with current tasks');
    }

    return { suggestions: suggestions.slice(0, 3) };
  }
}
