import React, { useState, useEffect } from 'react';

interface TaskMetrics {
  linesAdded: number;
  linesModified: number;
  filesChanged: number;
  codeQualityScore: number;
}

interface Task {
  taskId: string;
  status: 'running' | 'completed' | 'failed';
  developmentGoals: string[];
  currentIteration: number;
  progress: number;
  startTime: string;
  lastUpdate: string;
  currentPhase: string;
  metrics: TaskMetrics;
}

interface TaskMonitorProps {
  onTaskUpdate?: (task: Task) => void;
}

const TaskMonitor: React.FC<TaskMonitorProps> = ({ onTaskUpdate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000);

  const fetchTasks = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch('https://arq-ai.ru/api/v1/arq/tasks');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: Task[] = await response.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: Task['status']): string => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'running': return '#3b82f6';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const selectedTaskData = tasks.find(t => t.taskId === selectedTask);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Task Monitor</h2>

      <div style={styles.controls}>
        <label>
          Refresh Interval (ms):
          <input
            type="number"
            min="1000"
            max="60000"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 5000)}
            disabled={loading}
          />
        </label>
        <button onClick={fetchTasks} disabled={loading} style={styles.button}>
          {loading ? 'Fetching...' : 'Refresh Now'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.taskList}>
        <h3>Active Tasks</h3>
        {tasks.length === 0 ? (
          <p>No tasks running</p>
        ) : (
          tasks.map(task => (
            <div
              key={task.taskId}
              style={{
                ...styles.taskItem,
                backgroundColor: selectedTask === task.taskId ? '#f3f4f6' : 'white',
              }}
              onClick={() => setSelectedTask(task.taskId)}
            >
              <div style={styles.taskHeader}>
                <span style={{ color: getStatusColor(task.status), fontWeight: 'bold' }}>
                  {task.status.toUpperCase()}
                </span>
                <span>{task.taskId}</span>
              </div>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${task.progress}%`,
                    backgroundColor: getStatusColor(task.status),
                  }}
                />
              </div>
              <div style={styles.taskInfo}>
                <span>Iteration: {task.currentIteration}</span>
                <span>Progress: {task.progress}%</span>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedTaskData && (
        <div style={styles.taskDetails}>
          <h3>Task Details</h3>
          <div style={styles.detailsGrid}>
            <div>
              <strong>Task ID:</strong>
              <p>{selectedTaskData.taskId}</p>
            </div>
            <div>
              <strong>Status:</strong>
              <p style={{ color: getStatusColor(selectedTaskData.status) }}>
                {selectedTaskData.status.toUpperCase()}
              </p>
            </div>
            <div>
              <strong>Current Phase:</strong>
              <p>{selectedTaskData.currentPhase}</p>
            </div>
            <div>
              <strong>Progress:</strong>
              <p>{selectedTaskData.progress}%</p>
            </div>
            <div>
              <strong>Started:</strong>
              <p>{formatTime(selectedTaskData.startTime)}</p>
            </div>
            <div>
              <strong>Last Update:</strong>
              <p>{formatTime(selectedTaskData.lastUpdate)}</p>
            </div>
          </div>

          <h4>Metrics</h4>
          <div style={styles.metricsGrid}>
            <div>Lines Added: {selectedTaskData.metrics.linesAdded}</div>
            <div>Lines Modified: {selectedTaskData.metrics.linesModified}</div>
            <div>Files Changed: {selectedTaskData.metrics.filesChanged}</div>
            <div>Code Quality Score: {selectedTaskData.metrics.codeQualityScore}%</div>
          </div>

          <h4>Goals</h4>
          <ul>
            {selectedTaskData.developmentGoals.map((goal, idx) => (
              <li key={idx}>{goal}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' },
  title: { fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' },
  controls: { display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' },
  button: { padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  error: { backgroundColor: '#fee2e2', color: '#7f1d1d', padding: '12px', borderRadius: '4px', marginBottom: '15px' },
  taskList: { marginBottom: '30px' },
  taskItem: { border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px', marginBottom: '10px', cursor: 'pointer', transition: 'all 0.2s' },
  taskHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  progressBar: { backgroundColor: '#e5e7eb', borderRadius: '4px', height: '8px', marginBottom: '8px', overflow: 'hidden' },
  progressFill: { height: '100%', transition: 'width 0.3s' },
  taskInfo: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' },
  taskDetails: { backgroundColor: 'white', padding: '15px', borderRadius: '6px', border: '1px solid #e5e7eb' },
  detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '15px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '4px' },
};

export default TaskMonitor;
