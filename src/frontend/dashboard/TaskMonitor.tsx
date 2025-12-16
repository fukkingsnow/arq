import React, { useState, useEffect } from 'react';

interface Task {
  taskId: string;
  status: 'running' | 'completed' | 'failed';
  developmentGoals: string[];
  currentIteration: number;
  maxIterations: number;
  progress: number;
  startTime: string;
  lastUpdate: string;
  currentPhase: string;
  metrics?: {
    linesAdded: number;
    linesModified: number;
    filesChanged: number;
    codeQualityScore: number;
  };
}

const TaskMonitor: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(3000);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://arq-ai.ru/api/v1/arq/tasks');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setTasks(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return '#4CAF50';
      case 'completed':
        return '#2196F3';
      case 'failed':
        return '#f44336';
      default:
        return '#999';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Active Tasks Monitor</h2>
        <div style={styles.controls}>
          <button onClick={fetchTasks} style={styles.button} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Now'}
          </button>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            style={styles.select}
          >
            <option value={1000}>Every 1s</option>
            <option value={3000}>Every 3s</option>
            <option value={5000}>Every 5s</option>
          </select>
        </div>
      </div>

      {error && <div style={styles.error}>Error: {error}</div>}

      {tasks.length === 0 ? (
        <div style={styles.empty}>
          <p>No active tasks</p>
        </div>
      ) : (
        <div style={styles.tasksGrid}>
          {tasks.map((task) => (
            <div key={task.taskId} style={styles.taskCard}>
              <h3>Task {task.taskId.substring(0, 8)}</h3>
              <div>Status: {task.status}</div>
              <div>Progress: {task.progress}%</div>
              <div>Iteration: {task.currentIteration}/{task.maxIterations}</div>
              <div>Phase: {task.currentPhase}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '20px', backgroundColor: '#fafafa', borderRadius: '4px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  controls: { display: 'flex', gap: '10px' },
  button: { padding: '8px 16px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  select: { padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' },
  error: { padding: '12px', backgroundColor: '#ffebee', borderLeft: '4px solid #f44336', color: '#c62828', marginBottom: '20px' },
  empty: { textAlign: 'center', padding: '40px 20px', color: '#666' },
  tasksGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' },
  taskCard: { backgroundColor: 'white', borderRadius: '4px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
} as const;

export default TaskMonitor;
