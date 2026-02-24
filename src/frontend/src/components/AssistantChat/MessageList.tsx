import React from 'react';
import type { Message } from './types/assistant';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  className?: string;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading,
  className = '',
}) => {
  if (messages.length === 0 && !loading) {
    return (
      <div className={`message-list message-list--empty ${className}`}>
        <p>No messages yet. Start by asking a question.</p>
      </div>
    );
  }

  return (
    <div className={`message-list ${className}`} role="log" aria-live="polite">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`message message--${message.role}`}
          data-timestamp={message.timestamp}
        >
          <div className="message__header">
            <span className="message__role">
              {message.role === 'user' ? 'You' : 'AI Assistant'}
            </span>
            <time className="message__time">
              {new Date(message.timestamp).toLocaleTimeString()}
            </time>
          </div>
          <div className="message__content">
            {message.content}
          </div>
          {message.metadata && (
            <div className="message__metadata">
              {message.metadata.tokenCount && (
                <span className="message__meta-item">
                  Tokens: {message.metadata.tokenCount}
                </span>
              )}
              {message.metadata.processingTime && (
                <span className="message__meta-item">
                  Time: {message.metadata.processingTime}ms
                </span>
              )}
            </div>
          )}
        </div>
      ))}
      {loading && (
        <div className="message message--loading">
          <div className="message__spinner"></div>
          <span>AI is thinking...</span>
        </div>
      )}
    </div>
  );
};

export default MessageList;
