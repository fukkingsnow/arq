import React, { useState, useRef, useEffect } from 'react';
import type { TaskQuery } from './types/assistant';

interface QueryInputProps {
  onSubmit: (query: TaskQuery) => void;
  loading: boolean;
  className?: string;
}

const QueryInput: React.FC<QueryInputProps> = ({
  onSubmit,
  loading,
  className = '',
}) => {
  const [queryText, setQueryText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('general');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;

    onSubmit({
      query: queryText,
      type: selectedType,
      tags,
    });

    setQueryText('');
    setSelectedType('general');
    setTags([]);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      handleSubmit(e as any);
    }
  };

  return (
    <form className={`query-input ${className}`} onSubmit={handleSubmit}>
      <div className="query-input__tags-container">
        {tags.map((tag, index) => (
          <div key={index} className="query-input__tag">
            {tag}
            <button
              type="button"
              className="query-input__tag-remove"
              onClick={() => handleRemoveTag(index)}
              aria-label={`Remove tag ${tag}`}
            >
              X
            </button>
          </div>
        ))}
      </div>

      <div className="query-input__controls">
        <select
          className="query-input__type-select"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          disabled={loading}
        >
          <option value="general">General Question</option>
          <option value="analysis">Analysis</option>
          <option value="suggestion">Suggestion</option>
          <option value="debug">Debug</option>
        </select>

        <input
          type="text"
          className="query-input__tag-input"
          placeholder="Add tag (Ctrl+Enter)"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddTag();
            }
          }}
          disabled={loading}
        />
        <button
          type="button"
          className="query-input__tag-btn"
          onClick={handleAddTag}
          disabled={loading || !tagInput.trim()}
        >
          Add
        </button>
      </div>

      <div className="query-input__textarea-wrapper">
        <textarea
          ref={textareaRef}
          className="query-input__textarea"
          placeholder="Ask your question..."
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={3}
          maxLength={2000}
        />
        <span className="query-input__char-count">
          {queryText.length}/2000
        </span>
      </div>

      <button
        type="submit"
        className="query-input__submit-btn"
        disabled={loading || !queryText.trim()}
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
};

export default QueryInput;
