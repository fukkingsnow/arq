export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    tokenCount?: number;
    processingTime?: number;
    model?: string;
  };
}

export interface TaskQuery {
  query: string;
  type?: 'general' | 'analysis' | 'suggestion' | 'debug';
  tags?: string[];
  taskContext?: {
    taskId?: string;
    taskName?: string;
    currentStatus?: string;
  };
}

export interface AssistantResponse {
  success: boolean;
  message?: Message;
  error?: string;
  suggestions?: string[];
}

export interface UseAssistantReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendQuery: (query: TaskQuery) => Promise<void>;
  clearMessages: () => void;
  retryLastQuery: () => Promise<void>;
}

export interface APIMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  metadata?: Record<string, any>;
}
