import React, { useState } from 'react';

interface TaskInput {
  description: string;
  priority: 'low' | 'medium' | 'high';
}

interface TaskCreatorProps {
  onTaskCreated?: (task: any) => void;
}

const TaskCreator: React.FC<TaskCreatorProps> = ({ onTaskCreated }) => {
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCreateTask = async () => {
    if (!description.trim()) {
      setMessage({ type: 'error', text: 'Task description is required' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://arq-ai.ru/api/v1/arq/start-development', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, priority }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: `Task created: ${data.id}` });
        setDescription('');
        setPriority('medium');
        onTaskCreated?.(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to create task' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2>Create New Task</h2>
      <div style={styles.form}>
        <label style={styles.label}>
          Description:
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description"
            style={styles.textarea}
            disabled={loading}
          />
        </label>
        <label style={styles.label}>
          Priority:
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            style={styles.select}
            disabled={loading}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <button
          onClick={handleCreateTask}
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </div>
      {message && (
        <div style={{
          ...styles.message,
          backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: message.type === 'success' ? '#065f46' : '#7f1d1d',
        }}
        >
          {message.text}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '15px' },
  label: { display: 'flex', flexDirection: 'column' as const, gap: '8px', fontSize: '14px' },
  textarea: { padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontFamily: 'inherit', minHeight: '100px', resize: 'vertical' as const },
  select: { padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' },
  button: { padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  message: { marginTop: '15px', padding: '12px', borderRadius: '4px', fontSize: '14px' },
};

export default TaskCreator;
