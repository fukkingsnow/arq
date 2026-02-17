import React, { useState, useRef, useEffect } from 'react';
import { useAssistant } from './hooks/useAssistant';
import MessageList from './MessageList';
import QueryInput from './QueryInput';
import './AssistantChat.module.css';
import type { Message, TaskQuery } from './types/assistant';

interface AssistantChatProps {
  taskId?: string;
  onClose?: () => void;
  className?: string;
}

const AssistantChat: React.FC<AssistantChatProps> = ({ taskId, onClose, className = '' }) => {
  const {
    messages,
    loading,
    error,
    sendQuery,
    clearMessages,
    retryLastQuery,
  } = useAssistant(taskId);

  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendQuery = async (query: TaskQuery) => {
    await sendQuery(query);
  };

  const handleClear = () => {
    if (window.confirm('Clear all messages?')) {
      clearMessages();
    }
  };

  if (isMinimized) {
    return (
      <div className={`assistant-chat assistant-chat--minimized ${className}`}>
        <button
          className="assistant-chat__expand-btn"
          onClick={() => setIsMinimized(false)}
          aria-label="Expand chat"
        >
          Chat
        </button>
      </div>
    );
  }

  return (
    <div className={`assistant-chat ${className}`}>
      <div className="assistant-chat__header">
        <h3 className="assistant-chat__title">AI Assistant</h3>
        <div className="assistant-chat__controls">
          {messages.length > 0 && (
            <button
              className="assistant-chat__btn assistant-chat__btn--secondary"
              onClick={handleClear}
              aria-label="Clear messages"
              title="Clear all messages"
            >
              Clear
            </button>
          )}
          <button
            className="assistant-chat__btn assistant-chat__btn--secondary"
            onClick={() => setIsMinimized(true)}
            aria-label="Minimize chat"
            title="Minimize"
          >
            −
          </button>
          {onClose && (
            <button
              className="assistant-chat__btn assistant-chat__btn--secondary"
              onClick={onClose}
              aria-label="Close chat"
              title="Close"
            >
              X
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="assistant-chat__error" role="alert">
          <p>{error}</p>
          <button
            className="assistant-chat__btn assistant-chat__btn--small"
            onClick={retryLastQuery}
          >
            Retry
          </button>
        </div>
      )}

      <MessageList
        messages={messages}
        loading={loading}
        className="assistant-chat__messages"
      />
      <div ref={messagesEndRef} />

      <QueryInput
        onSubmit={handleSendQuery}
        loading={loading}
        className="assistant-chat__input"
      />
    </div>
  );
};

export default AssistantChat;
