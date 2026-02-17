import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
  ) {}

  async saveMessage(
    taskId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, any>,
  ): Promise<Conversation> {
    const conversation = this.conversationRepository.create({
      taskId,
      role,
      content,
      metadata,
      status: 'active',
    });
    return this.conversationRepository.save(conversation);
  }

  async getConversationHistory(taskId: string, limit: number = 50): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { taskId, status: 'active' },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async getRecentMessages(taskId: string, count: number = 10): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { taskId, status: 'active' },
      order: { createdAt: 'DESC' },
      take: count,
    });
  }

  async archiveConversation(conversationId: string): Promise<void> {
    await this.conversationRepository.update(
      { id: conversationId },
      { status: 'archived' },
    );
  }

  async clearTaskConversation(taskId: string): Promise<void> {
    await this.conversationRepository.update(
      { taskId, status: 'active' },
      { status: 'archived' },
    );
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.conversationRepository.delete({ id: conversationId });
  }

  async getConversationStats(taskId: string): Promise<{
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    firstMessage?: Date;
    lastMessage?: Date;
  }> {
    const conversations = await this.conversationRepository.find({
      where: { taskId, status: 'active' },
    });

    const userMessages = conversations.filter((c) => c.role === 'user').length;
    const assistantMessages = conversations.filter((c) => c.role === 'assistant').length;

    return {
      totalMessages: conversations.length,
      userMessages,
      assistantMessages,
      firstMessage: conversations[0]?.createdAt,
      lastMessage: conversations[conversations.length - 1]?.createdAt,
    };
  }
}
