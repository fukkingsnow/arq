import React, { useEffect, useState } from 'react';
import styles from './ARQDashboard.module.css';
import TaskMonitor from './TaskMonitor';
import HealthCheckModal from '../components/HealthCheckModal';

interface Task {
  taskId: string;
  title: string;
  status: 'queued' | 'in_progress' | 'completed';
  branch: string;
  createdAt: string;
  developmentGoals: string[];
  result?: any;
  logs?: string;
  iterationsCurrent?: number;
  iterationsMax?: number;
}

export const ARQDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'HDN' });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'details'>('list');
  const [taskStartTimes, setTaskStartTimes] = useState<Record<string, number>>({});
  const [showHealthModal, setShowHealthModal] = useState(false);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch('https://arq-ai.ru/api/v1/arq/tasks');
      setTasks(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, []);

  // Create task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('https://arq-ai.ru/api/v1/arq/start-development', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          priority: formData.priority
        })
      });
      const newTask = await res.json();
      setTasks([newTask, ...tasks]);
      setFormData({ title: '', description: '', priority: 'HDN' });
      setTaskStartTimes({
        ...taskStartTimes,
        [newTask.taskId]: Date.now()
      });
      setActiveTab('list');
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const getProgressPercent = (task: Task): number => {
    if (task.status === 'completed') return 100;
    if (task.status === 'queued') return 0;
    if (task.iterationsCurrent !== undefined && task.iterationsMax) {
      return Math.round((task.iterationsCurrent / task.iterationsMax) * 100);
    }
    return 50;
  };

  const getElapsedTime = (task: Task): string => {
    const startTime = taskStartTimes[task.taskId] || new Date(task.createdAt).getTime();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ARQ Task Creator</h1>
      <p className={styles.subtitle}>Create and submit development tasks</p>
      <p className={styles.status}>✓ Service Online</p>

      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'create' ? styles.active : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Task
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'list' ? styles.active : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Active Tasks
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'details' ? styles.active : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Task Details
        </button>
      </div>

      {activeTab === 'create' && (
        <form onSubmit={handleCreateTask} className={styles.form}>
          <h2 className={styles.subtitle}>Development Goal #1</h2>
          <input
            type="text"
            placeholder="Enter development goal"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={styles.input}
          />

          <h2 className={styles.subtitle}>Development Goal #2</h2>
          <input
            type="text"
            placeholder="Enter development goal"
            className={styles.input}
          />

          <h2 className={styles.subtitle}>Development Goal #3</h2>
          <input
            type="text"
            placeholder="Enter development goal"
            className={styles.input}
          />

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Task'}
          </button>
        </form>
      )}

      {activeTab === 'list' && (
        <div className={styles.taskList}>
          <h2>Active Tasks</h2>
          <div className={styles.taskListContainer}>
            <button
              onClick={() => setShowHealthModal(true)}
              className={styles.button}
              style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#4CAF50' }}
            >
              Check Health
            </button>
            {tasks.map((task) => (
              <div key={task.taskId} className={styles.taskItem}>
                <div className={styles.taskHeader}>
                  <strong>{task.title}</strong>
                  <span className={styles.status}>
                    {task.status === 'completed' ? '✓' : task.status === 'in_progress' ? '⟳' : '⧗'}
                  </span>
                </div>
                <div className={styles.taskMeta}>
                  <span className={styles.createdTime}>{new Date(task.createdAt).toLocaleDateString()}</span>
                </div>
                <div className={styles.progressContainer}>
                  <div
                    className={styles.progressBar}
                    style={{
                      width: `${getProgressPercent(task)}%`,
                      backgroundColor: getStatusColor(task.status)
                    }}
                  />
                </div>
                <div className={styles.progressStats}>
                  <span>{getProgressPercent(task)}% Complete</span>
                  <span>Elapsed: {getElapsedTime(task)}</span>
                  {selectedTask?.iterationsCurrent !== undefined && (
                    <div>Iterations: {selectedTask.iterationsCurrent} / {selectedTask.iterationsMax}</div>
                  )}
                </div>
                <div className={styles.logSection}>
                  {selectedTask?.logs ? (
                    <pre>{selectedTask.logs}</pre>
                  ) : (
                    <p className={styles.noLogs}>No logs available yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'details' && selectedTask ? (
        <div className={styles.detailsSection}>
          <h2>Task Details</h2>
          {selectedTask.result ? (
            <div className={styles.resultBox}>
              <h3>Result Verification</h3>
              <pre>{JSON.stringify(selectedTask.result, null, 2)}</pre>
            </div>
          ) : (
            <div className={styles.resultBox}>
              <h3>No Result</h3>
              <p className={styles.noResult}>Awaiting task completion...</p>
            </div>
          )}
          <div className={styles.logSection}>
            <h3>Execution Logs</h3>
            {selectedTask.logs ? (
              <pre>{selectedTask.logs}</pre>
            ) : (
              <p className={styles.noLogs}>No logs available yet</p>
            )}
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
        <h3>Active Tasks - Real-time Monitoring</h3>
        <TaskMonitor />
      </div>

      <HealthCheckModal isOpen={showHealthModal} onClose={() => setShowHealthModal(false)} />
    </div>
  );
};

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return '#4CAF50';
    case 'in_progress':
      return '#2196F3';
    case 'queued':
      return '#FFC107';
    default:
      return '#999';
  }
}
