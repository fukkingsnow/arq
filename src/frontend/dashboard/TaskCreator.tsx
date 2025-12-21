// @ts-nocheck
import React, { useState } from 'react';

interface TaskResponse {
  id: string;
  [key: string]: any;
}

interface TaskCreatorProps {
  onTaskCreated?: (task: TaskResponse) => void;
}

type TaskType = 'Bug' | 'Feature' | 'Refactor' | 'Research';

const availableTags = [
  'backend', 'frontend', 'infra', 'LLM', 'billing',
  'performance', 'security', 'testing', 'docs', 'devops'
];

const TaskCreator: React.FC<TaskCreatorProps> = ({ onTaskCreated }) => {
  const [developmentGoals, setDevelopmentGoals] = useState<string[]>(['', '', '']);
  const [maxIterations, setMaxIterations] = useState<number>(5);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskType, setTaskType] = useState<TaskType>('Feature');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Goal #1 required
    if (!developmentGoals[0]?.trim()) {
      errors.goal1 = '❌ Goal #1 is required';
    } else if (developmentGoals[0].length < 5) {
      errors.goal1 = '⚠️ Minimum 5 characters';
    } else if (developmentGoals[0].length > 200) {
      errors.goal1 = '⚠️ Maximum 200 characters';
    }

    // Goals #2 and #3 optional but validate if provided
    if (developmentGoals[1] && (developmentGoals[1].length < 5 || developmentGoals[1].length > 200)) {
      errors.goal2 = '⚠️ 5-200 characters';
    }
    if (developmentGoals[2] && (developmentGoals[2].length < 5 || developmentGoals[2].length > 200)) {
      errors.goal3 = '⚠️ 5-200 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGoalChange = (index: number, value: string) => {
    if (value.length <= 200) {
      const newGoals = [...developmentGoals];
      newGoals[index] = value;
      setDevelopmentGoals(newGoals);
      // Clear error for this field
      const errors = { ...validationErrors };
      delete errors[`goal${index + 1}`];
      setValidationErrors(errors);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleCreateTask = async (): Promise<void> => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('https://arq-ai.ru/api/v1/arq/start-development', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          developmentGoals: developmentGoals.filter(g => g.trim()),
          maxIterations,
          priority,
          taskType,
          tags: selectedTags
        }),
      });

      if (response.ok) {
        const data: TaskResponse = await response.json();
        setMessage({ type: 'success', text: `✔️ Task created: ${data.id}` });
        setDevelopmentGoals(['', '', '']);
        setMaxIterations(5);
        setPriority('medium');
        setTaskType('Feature');
        setSelectedTags([]);
        setValidationErrors({});
        onTaskCreated?.(data);
      } else {
        setMessage({ type: 'error', text: `❌ Failed: ${response.status}` });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: `❌ Error: ${errorMessage}` });
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🚀 ARQ Task Creator</h2>
      <div style={styles.form}>
        {/* Goal Fields */}
        {[0, 1, 2].map((index) => (
          <div key={index} style={styles.formGroup}>
            <label style={styles.label}>
              Development Goal #{index + 1}
              {index === 0 && <span style={{ color: '#dc2626' }}> *</span>}
            </label>
            <textarea
              value={developmentGoals[index]}
              onChange={(e) => handleGoalChange(index, e.target.value)}
              placeholder={index === 0 ? "e.g., 'Reduce API response time to 300ms under 100 rps load'" : 'Optional'}
              style={{
                ...styles.input,
                minHeight: '60px',
                fontFamily: 'monospace',
                borderColor: validationErrors[`goal${index + 1}`] ? '#dc2626' : '#d1d5db'
              }}
              disabled={loading}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{
                fontSize: '11px',
                color: developmentGoals[index].length > 200 ? '#dc2626' : developmentGoals[index].length >= 180 ? '#f97316' : '#6b7280'
              }}>
                {developmentGoals[index].length}/200 chars
              </span>
              {validationErrors[`goal${index + 1}`] && (
                <span style={{ fontSize: '11px', color: '#dc2626' }}>
                  {validationErrors[`goal${index + 1}`]}
                </span>
              )}
            </div>
            {index === 0 && (
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                fontStyle: 'italic',
                marginTop: '6px',
                padding: '8px',
                backgroundColor: '#f3f4f6',
                borderRadius: '4px'
              }}>
                📝 <strong>Example:</strong> Be specific: include metric, target value, and expected timeframe
              </div>
            )}
          </div>
        ))}

        {/* Max Iterations */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Max Iterations</label>
          <input
            type="number"
            min="1"
            max="20"
            value={maxIterations}
            onChange={(e) => setMaxIterations(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
            style={styles.input}
            disabled={loading}
          />
          <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Range: 1-20</span>
        </div>

        {/* Priority */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            style={styles.input}
            disabled={loading}
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>
        </div>

        {/* Task Type */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Task Type <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value as TaskType)}
            style={styles.input}
            disabled={loading}
          >
            <option value="Feature">✨ Feature</option>
            <option value="Bug">🐛 Bug Fix</option>
            <option value="Refactor">♻️ Refactor</option>
            <option value="Research">🔬 Research</option>
          </select>
        </div>

        {/* Tags */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Tags</label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#f9fafb'
          }}>
            {availableTags.map(tag => (
              <label key={tag} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                  disabled={loading}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px' }}>{tag}</span>
              </label>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <div style={{
              marginTop: '8px',
              fontSize: '12px',
              color: '#4b5563',
              padding: '6px',
              backgroundColor: '#e0f2fe',
              borderRadius: '4px'
            }}>
              🍿 Selected: {selectedTags.join(', ')}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleCreateTask}
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Processing...' : '📤 Submit Task'}
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div style={{
          marginTop: '15px',
          padding: '12px',
          borderRadius: '4px',
          fontSize: '14px',
          backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: message.type === 'success' ? '#065f46' : '#7f1d1d',
          border: `1px solid ${message.type === 'success' ? '#6ee7b7' : '#fca5a5'}`
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '20px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#1f2937'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#374151'
  },
  input: {
    padding: '10px',
    fontSize: '13px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontFamily: 'inherit',
    backgroundColor: '#ffffff'
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  }
};

export default TaskCreator;
