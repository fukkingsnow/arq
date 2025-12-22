import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Conversation } from './entities/conversation.entity';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('message')
  async saveMessage(
    @Body() body: {
      taskId: string;
      role: 'user' | 'assistant';
      content: string;
      metadata?: Record<string, any>;
    },
  ): Promise<Conversation> {
    return this.chatService.saveMessage(
      body.taskId,
      body.role,
      body.content,
      body.metadata,
    );
  }

  @Get('history/:taskId')
  async getHistory(
    @Param('taskId') taskId: string,
    @Query('limit') limit: number = 50,
  ): Promise<Conversation[]> {
    return this.chatService.getConversationHistory(taskId, limit);
  }

  @Get('recent/:taskId')
  async getRecentMessages(
    @Param('taskId') taskId: string,
    @Query('count') count: number = 10,
  ): Promise<Conversation[]> {
    return this.chatService.getRecentMessages(taskId, count);
  }

  @Get('stats/:taskId')
  async getStats(@Param('taskId') taskId: string) {
    return this.chatService.getConversationStats(taskId);
  }

  @Post('archive/:conversationId')
  async archiveConversation(
    @Param('conversationId') conversationId: string,
  ): Promise<{ success: boolean }> {
    await this.chatService.archiveConversation(conversationId);
    return { success: true };
  }

  @Post('clear/:taskId')
  async clearTaskConversation(
    @Param('taskId') taskId: string,
  ): Promise<{ success: boolean }> {
    await this.chatService.clearTaskConversation(taskId);
    return { success: true };
  }
}
