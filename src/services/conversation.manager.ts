import { Injectable } from '@nestjs/common';
import { DialogContext } from '../common/interfaces/dialogue.interface';

export interface Conversation {
  id: string;
  sessionId: string;
  userId: string;
  messages: DialogMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface DialogMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * ConversationManager - Phase 33 Implementation
 * 
 * Manages conversation state, message history, and session context.
 * Provides conversation lifecycle management (creation, updates, cleanup).
 */
@Injectable()
export class ConversationManager {
  private conversations: Map<string, Conversation> = new Map();
  private readonly maxMessagesPerConversation = 1000;
  private readonly conversationTTL = 24 * 60 * 60 * 1000; // 24 hours in ms

  /**
   * Create a new conversation
   */
  createConversation(sessionId: string, userId: string): Conversation {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const conversation: Conversation = {
      id: conversationId,
      sessionId,
      userId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
    };
    this.conversations.set(conversationId, conversation);
    return conversation;
  }

  /**
   * Get conversation by ID
   */
  getConversation(conversationId: string): Conversation | null {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Add message to conversation
   */
  addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
  ): DialogMessage | null {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return null;
    }

    // Enforce message limit
    if (conversation.messages.length >= this.maxMessagesPerConversation) {
      conversation.messages.shift(); // Remove oldest message
    }

    const message: DialogMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date();

    return message;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string): DialogMessage[] | null {
    const conversation = this.conversations.get(conversationId);
    return conversation ? conversation.messages : null;
  }

  /**
   * Get conversation context for dialogue processing
   */
  getConversationContext(
    conversationId: string,
  ): Partial<DialogContext> | null {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return null;
    }

    return {
      sessionId: conversation.sessionId,
      userId: conversation.userId,
      conversationHistory: conversation.messages,
      metadata: conversation.metadata,
    };
  }

  /**
   * Update conversation metadata
   */
  updateMetadata(
    conversationId: string,
    metadata: Record<string, any>,
  ): boolean {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return false;
    }

    conversation.metadata = { ...conversation.metadata, ...metadata };
    conversation.updatedAt = new Date();
    return true;
  }

  /**
   * Close conversation
   */
  closeConversation(conversationId: string): boolean {
    return this.conversations.delete(conversationId);
  }

  /**
   * Clear old conversations (cleanup)
   */
  clearExpiredConversations(): number {
    let cleared = 0;
    const now = Date.now();

    for (const [id, conversation] of this.conversations.entries()) {
      if (now - conversation.updatedAt.getTime() > this.conversationTTL) {
        this.conversations.delete(id);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Get conversation statistics
   */
  getStatistics() {
    return {
      totalConversations: this.conversations.size,
      totalMessages: Array.from(this.conversations.values()).reduce(
        (sum, conv) => sum + conv.messages.length,
        0,
      ),
      maxMessagesPerConversation: this.maxMessagesPerConversation,
      conversationTTL: this.conversationTTL,
    };
  }
}
