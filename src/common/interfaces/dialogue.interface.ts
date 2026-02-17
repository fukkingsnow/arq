export interface DialogContext {
  userId: string;
  sessionId: string;
  intentId?: string;
  enriched?: boolean;
  routed?: boolean;
  transformed?: boolean;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface ConversationMessage {
  id: string;
  text: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  userId: string;
  sessionId: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}
