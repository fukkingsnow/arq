// @ts-nocheck
import React, { useState } from 'react';

interface TaskResponse {
  id: string;
  [key: string]: any;
}

interface TaskCreatorProps {
  onTaskCreated?: (task: TaskResponse) => void;
}

const availableGoals = [
  'Improve code quality',
  'Add new features',
  'Enhance performance',
  'Fix bugs',
  'Improve documentation',
  'Refactor code',
  'Add tests',
  'Security improvements'
];

const TaskCreator: React.FC<TaskCreatorProps> = ({ onTaskCreated }) => {
  const [developmentGoals, setDevelopmentGoals] = useState<string[]>(['Improve code quality']);
  const [maxIterations, setMaxIterations] = useState<number>(3);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleGoalToggle = (goal: string): void => {
    setDevelopmentGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleCreateTask = async (): Promise<void> => {
    if (developmentGoals.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one development goal' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://arq-ai.ru/api/v1/arq/start-development', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          developmentGoals,
          maxIterations,
          priority
        }),
      });

      if (response.ok) {
        const data: TaskResponse = await response.json();
        setMessage({ type: 'success', text: `Task created: ${data.id}` });
        setDevelopmentGoals(['Improve code quality']);
        setMaxIterations(3);
        setPriority('medium');
        onTaskCreated?.(data);
      } else {
        setMessage({ type: 'error', text: `Failed: ${response.status}` });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: `Error: ${errorMessage}` });
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Start Development</h2>
      <div style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Development Goals</label>
          <div style={styles.goalsGrid}>
            {availableGoals.map(goal => (
              <div key={goal} style={styles.goalItem}>
                <input
                  type="checkbox"
                  checked={developmentGoals.includes(goal)}
                  onChange={() => handleGoalToggle(goal)}
                  disabled={loading}
                />
                <span>{goal}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.formGroup}>
          <label>Priority: <select value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')} disabled={loading}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select></label>
        </div>

        <div style={styles.formGroup}>
          <label>Max Iterations: <input type="number" min="1" max="10" value={maxIterations} onChange={(e) => setMaxIterations(Math.max(1, parseInt(e.target.value) || 1))} disabled={loading} /></label>
        </div>

        <button onClick={handleCreateTask} disabled={loading} style={{...styles.button, opacity: loading ? 0.6 : 1}}>
          {loading ? 'Starting...' : 'Start Development Cycle'}
        </button>
      </div>

      {message && (
        <div style={{
          ...styles.message,
          backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: message.type === 'success' ? '#065f46' : '#7f1d1d',
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '20px' },
  title: { fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontWeight: '600', fontSize: '14px' },
  goalsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' },
  goalItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' },
  button: { padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  message: { marginTop: '15px', padding: '12px', borderRadius: '4px', fontSize: '14px' },
};

export default TaskCreator;
