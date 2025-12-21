import React, { useEffect, useState } from 'react';
import styles from './ARQDashboard.module.css';
import TaskMonitor from './TaskMonitor';

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

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch('https://arq-ai.ru/api/v1/arq/tasks');
      setTasks(await res.json());
    } catch (e) { console.error(e); }
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
      setTaskStartTimes({ ...taskStartTimes, [newTask.taskId]: Date.now() });
      setActiveTab('list');
    } catch (e) { console.error(e); }
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
    if (elapsed < 60) return `${elapsed}s`;
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m`;
    return `${Math.floor(elapsed / 3600)}h`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#3B82F6';
      default: return '#F59E0B';
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h1>🚀 ARQ Task Management</h1>
        <p>Visual Monitoring & Metrics Dashboard</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'list' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('list')}
        >
          📋 Tasks
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'create' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('create')}
        >
          ➕ Create
        </button>
        {selectedTask && (
          <button
            className={`${styles.tab} ${activeTab === 'details' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('details')}
          >
            📊 Details
          </button>
        )}
      </div>

      {activeTab === 'create' && (
        <div className={styles.section}>
          <form onSubmit={handleCreateTask} className={styles.form}>
            <div>
              <label>Task Title</label>
              <input
                type="text"
                placeholder="e.g., Implement real-time metrics"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label>Description</label>
              <textarea
                placeholder="Detailed task description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <label>Priority</label>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                <option value="HDN">High</option>
                <option value="MDN">Medium</option>
                <option value="LDN">Low</option>
              </select>
            </div>
            <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Task'}</button>
          </form>
        </div>
      )}

      {activeTab === 'list' && (
        <div className={styles.section}>
          <div className={styles.taskList}>
            {tasks.map((task) => {
              const progress = getProgressPercent(task);
              const elapsed = getElapsedTime(task);
              const statusColor = getStatusColor(task.status);
              return (
                <div key={task.taskId} className={styles.taskCard} onClick={() => { setSelectedTask(task); setActiveTab('details'); }}>
                  <div className={styles.taskHeader}>
                    <h3>{task.title}</h3>
                    <span className={styles.status} style={{ backgroundColor: statusColor }}>{task.status}</span>
                  </div>
                  <div className={styles.metrics}>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Progress</span>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progress}%`, backgroundColor: statusColor }}></div>
                      </div>
                      <span className={styles.metricValue}>{progress}%</span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Elapsed</span>
                      <span className={styles.metricValue} style={{ fontSize: '18px', fontWeight: 'bold' }}>{elapsed}</span>
                    </div>
                    {task.iterationsMax && (
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Iterations</span>
                        <span className={styles.metricValue}>{task.iterationsCurrent || 0}/{task.iterationsMax}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.taskMeta}>
                    <small>📅 {new Date(task.createdAt).toLocaleString()}</small>
                    <small>🌿 {task.branch}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'details' && selectedTask && (
        <div className={styles.section}>
          <div className={styles.detailsPanel}>
            <h2>{selectedTask.title}</h2>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <strong>Status:</strong> <span style={{ color: getStatusColor(selectedTask.status) }}>{selectedTask.status}</span>
              </div>
              <div className={styles.detailItem}>
                <strong>Task ID:</strong> <code>{selectedTask.taskId}</code>
              </div>
              <div className={styles.detailItem}>
                <strong>Created:</strong> {new Date(selectedTask.createdAt).toLocaleString()}
              </div>
              <div className={styles.detailItem}>
                <strong>Branch:</strong> {selectedTask.branch}
              </div>
            </div>
            <div className={styles.progressSection}>
              <h3>📈 Progress Tracking</h3>
              <div className={styles.largeProgressBar}>
                <div className={styles.progressFill} style={{ width: `${getProgressPercent(selectedTask)}%`, backgroundColor: getStatusColor(selectedTask.status) }}></div>
              </div>
              <div className={styles.progressStats}>
                <div>{getProgressPercent(selectedTask)}% Complete</div>
                <div>Elapsed: {getElapsedTime(selectedTask)}</div>
                {selectedTask.iterationsMax && <div>Iterations: {selectedTask.iterationsCurrent || 0}/{selectedTask.iterationsMax}</div>}
              </div>
            </div>
            <div className={styles.resultsSection}>
              <h3>✅ Result Verification</h3>
              {selectedTask.result ? (
                <div className={styles.resultBox}>
                  <pre>{JSON.stringify(selectedTask.result, null, 2)}</pre>
                </div>
              ) : (
                <p className={styles.noResult}>Awaiting task completion...</p>
              )}
            </div>
            <div className={styles.logsSection}>
              <h3>📝 Execution Logs</h3>
              {selectedTask.logs ? (
                <div className={styles.logsBox}>
                  <pre>{selectedTask.logs}</pre>
                </div>
              ) : (
                <p className={styles.noLogs}>No logs available yet</p>
              )}
            </div>
          </div>
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h3>Active Tasks - Real-time Monitoring</h3>
        <TaskMonitor />
      </div>        <h3>Active Tasks - Real-time Monitoring</h3>
        <TaskMonitor />
      </div>
        </div>
      )}
    </div>
  );
};

export default ARQDashboard;
