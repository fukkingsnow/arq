import { useState, useCallback, useRef } from 'react';
import type { Message, TaskQuery, UseAssistantReturn, APIMessage } from '../types/assistant';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';
const ASSISTANT_ENDPOINT = `${API_BASE}/assistant/chat`;

export const useAssistant = (taskId?: string): UseAssistantReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastQueryRef = useRef<TaskQuery | null>(null);

  const convertApiMessage = (apiMsg: APIMessage): Message => ({
    id: apiMsg.id,
    role: apiMsg.role as 'user' | 'assistant',
    content: apiMsg.content,
    timestamp: apiMsg.createdAt,
    metadata: apiMsg.metadata,
  });

  const sendQuery = useCallback(async (query: TaskQuery) => {
    setLoading(true);
    setError(null);
    lastQueryRef.current = query;

    try {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: query.query,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);

      const response = await fetch(ASSISTANT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.query,
          type: query.type || 'general',
          tags: query.tags || [],
          taskId,
          taskContext: query.taskContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.message) {
        const assistantMessage = convertApiMessage(data.message);
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send query';
      setError(errorMsg);
      console.error('useAssistant error:', err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const retryLastQuery = useCallback(async () => {
    if (lastQueryRef.current) {
      await sendQuery(lastQueryRef.current);
    }
  }, [sendQuery]);

  return {
    messages,
    loading,
    error,
    sendQuery,
    clearMessages,
    retryLastQuery,
  };
};

export default useAssistant;
