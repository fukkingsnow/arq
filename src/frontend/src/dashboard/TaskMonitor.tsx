// @ts-nocheck
import React, { useState, useEffect } from 'react';

interface TaskMetrics {
  linesAdded: number;
  linesModified: number;
  filesChanged: number;
  codeQualityScore: number;
}

interface Task {
  taskId: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  developmentGoals: string[];
  currentIteration: number;
  progress: number;
  startTime: string;
  lastUpdate: string;
  currentPhase: string;
  metrics: TaskMetrics;
  createdAt?: string;
  estimatedCompletion?: string;
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const handleTaskAction = async (taskId: string, action: 'cancel' | 'pause' | 'resume'): Promise<void> => {
    try {
      setActionLoading(action);
      const response = await fetch(`https://arq-ai.ru/api/v1/arq/tasks/${taskId}/${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Failed to ${action} task`);
      const updatedTask = await response.json();
      setTasks(tasks.map(t => t.taskId === taskId ? updatedTask : t));
      onTaskUpdate?.(updatedTask);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (taskId: string): void => {
    setSelectedTask(taskId);
    // In future, this could open a modal with detailed execution logs
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
      case 'paused': return '#f59e0b';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const shouldShowButton = (status: Task['status'], action: 'cancel' | 'pause' | 'resume'): boolean => {
    if (action === 'cancel') return status === 'running' || status === 'paused';
    if (action === 'pause') return status === 'running';
    if (action === 'resume') return status === 'paused';
    return false;
  };

  const selectedTaskData = tasks.find(t => t.taskId === selectedTask);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Active Tasks</h2>
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
            style={styles.input}
          />
        </label>
        <button onClick={fetchTasks} disabled={loading} style={styles.button}>
          {loading ? 'Fetching...' : 'Refresh'}
        </button>
      </div>
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.taskList}>
        {tasks.length === 0 ? (
          <p style={styles.noTasks}>No tasks yet. Create one to get started!</p>
        ) : (
          tasks.map(task => (
            <div
              key={task.taskId}
              style={{
                ...styles.taskItem,
                backgroundColor: selectedTask === task.taskId ? '#f3f4f6' : 'white',
                borderLeft: `4px solid ${getStatusColor(task.status)}`,
              }}
            >
              <div style={styles.taskHeader}>
                <div>
                  <span style={{ color: getStatusColor(task.status), fontWeight: 'bold', marginRight: '10px' }}>
                    {task.status.toUpperCase()}
                  </span>
                  <span style={styles.taskId}>{task.taskId}</span>
                </div>
                <button
                  onClick={() => handleViewDetails(task.taskId)}
                  style={{ ...styles.linkButton, marginLeft: 'auto' }}
                >
                  View details →
                </button>
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
                {task.createdAt && <span>Created: {formatTime(task.createdAt)}</span>}
              </div>
              <div style={styles.actionButtons}>
                {shouldShowButton(task.status, 'pause') && (
                  <button
                    onClick={() => handleTaskAction(task.taskId, 'pause')}
                    disabled={actionLoading === 'pause'}
                    style={{ ...styles.actionButton, ...styles.pauseButton }}
                  >
                    {actionLoading === 'pause' ? '⏸ Pausing...' : '⏸ Pause'}
                  </button>
                )}
                {shouldShowButton(task.status, 'resume') && (
                  <button
                    onClick={() => handleTaskAction(task.taskId, 'resume')}
                    disabled={actionLoading === 'resume'}
                    style={{ ...styles.actionButton, ...styles.resumeButton }}
                  >
                    {actionLoading === 'resume' ? '▶ Resuming...' : '▶ Resume'}
                  </button>
                )}
                {shouldShowButton(task.status, 'cancel') && (
                  <button
                    onClick={() => handleTaskAction(task.taskId, 'cancel')}
                    disabled={actionLoading === 'cancel'}
                    style={{ ...styles.actionButton, ...styles.cancelButton }}
                  >
                    {actionLoading === 'cancel' ? '✕ Cancelling...' : '✕ Cancel'}
                  </button>
                )}
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
  input: { marginLeft: '8px', padding: '6px 12px', borderRadius: '4px', border: '1px solid #d1d5db' },
  button: { padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' },
  error: { backgroundColor: '#fee2e2', color: '#7f1d1d', padding: '12px', borderRadius: '4px', marginBottom: '15px' },
  noTasks: { textAlign: 'center', color: '#6b7280', padding: '20px' },
  taskList: { marginBottom: '30px' },
  taskItem: { border: '1px solid #e5e7eb', borderRadius: '6px', padding: '15px', marginBottom: '12px', cursor: 'pointer', transition: 'all 0.2s' },
  taskHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  taskId: { fontSize: '14px', color: '#6b7280' },
  linkButton: { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '13px', fontWeight: '500', padding: '4px 8px' },
  progressBar: { backgroundColor: '#e5e7eb', borderRadius: '4px', height: '8px', marginBottom: '8px', overflow: 'hidden' },
  progressFill: { height: '100%', transition: 'width 0.3s' },
  taskInfo: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' },
  actionButtons: { display: 'flex', gap: '8px', marginTop: '12px' },
  actionButton: { padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500', transition: 'all 0.2s' },
  pauseButton: { backgroundColor: '#f59e0b', color: 'white' },
  resumeButton: { backgroundColor: '#10b981', color: 'white' },
  cancelButton: { backgroundColor: '#ef4444', color: 'white' },
  taskDetails: { backgroundColor: 'white', padding: '15px', borderRadius: '6px', border: '1px solid #e5e7eb' },
  detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '15px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '4px' },
};

export default TaskMonitor;
