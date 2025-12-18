import React, { useEffect, useState } from 'react';
import styles from './ARQDashboard.module.css';

interface Task {
  taskId: string;
  title: string;
  status: 'queued' | 'in_progress' | 'completed';
  branch: string;
  createdAt: string;
  developmentGoals: string[];
  result?: any;
  logs?: string;
}

export const ARQDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({title: '', description: '', priority: 'HIGH'});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'details'>('list');

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
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          priority: formData.priority
        })
      });
      const task = await res.json();
      setTasks([task, ...tasks]);
      setFormData({title: '', description: '', priority: 'HIGH'});
      alert('✅ Task created: ' + task.taskId);
      setActiveTab('list');
    } catch (e) {
      alert('❌ Error: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🚀 ARQ Task Management Dashboard</h1>
      
      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={activeTab === 'create' ? styles.activeTab : ''} onClick={() => setActiveTab('create')}>+ Create Task</button>
        <button className={activeTab === 'list' ? styles.activeTab : ''} onClick={() => setActiveTab('list')}>📋 Task List ({tasks.length})</button>
        <button className={activeTab === 'details' ? styles.activeTab : ''} onClick={() => setActiveTab('details')} disabled={!selectedTask}>📊 Task Details</button>
      </div>

      {/* Create Task Tab */}
      {activeTab === 'create' && (
        <div className={styles.section}>
          <h2>Create New Task</h2>
          <form onSubmit={handleCreateTask} className={styles.form}>
            <input
              type="text"
              placeholder="Task Title (required)"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              className={styles.input}
            />
            <textarea
              placeholder="Task Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className={styles.textarea}
            />
            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
              className={styles.select}
            >
              <option>LOW</option>
              <option>MEDIUM</option>
              <option selected>HIGH</option>
              <option>URGENT</option>
            </select>
            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? '⏳ Creating...' : '✅ Create Task'}
            </button>
          </form>
        </div>
      )}

      {/* Task List Tab */}
      {activeTab === 'list' && (
        <div className={styles.section}>
          <h2>Active Tasks</h2>
          {tasks.length === 0 ? (
            <p style={{textAlign: 'center', color: '#888', padding: '20px'}}>No tasks yet. Create one to get started!</p>
          ) : (
            <div className={styles.taskList}>
              {tasks.map(task => (
                <div key={task.taskId} className={styles.taskCard} onClick={() => {setSelectedTask(task); setActiveTab('details');}}>
                  <div className={styles.taskHeader}>
                    <h3>{task.title}</h3>
                    <span className={`${styles.badge} ${styles['badge-' + task.status]}`}>
                      {task.status === 'in_progress' ? '⚙️ Running' : task.status === 'completed' ? '✅ Done' : '⏳ Queued'}
                    </span>
                  </div>
                  <p style={{fontSize: '12px', color: '#666'}}>{new Date(task.createdAt).toLocaleString()}</p>
                  <p style={{margin: '10px 0', fontSize: '14px'}}>{task.branch || 'main'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task Details Tab */}
      {activeTab === 'details' && selectedTask && (
        <div className={styles.section}>
          <h2>Task Details</h2>
          <div className={styles.details}>
            <p><strong>ID:</strong> {selectedTask.taskId}</p>
            <p><strong>Title:</strong> {selectedTask.title}</p>
            <p><strong>Status:</strong> {selectedTask.status}</p>
            <p><strong>Created:</strong> {new Date(selectedTask.createdAt).toLocaleString()}</p>
            <p><strong>Branch:</strong> {selectedTask.branch}</p>
            {selectedTask.result && (
              <div>
                <p><strong>Result:</strong></p>
                <pre className={styles.resultBox}>{JSON.stringify(selectedTask.result, null, 2)}</pre>
              </div>
            )}
            {selectedTask.logs && (
              <div>
                <p><strong>Logs:</strong></p>
                <pre className={styles.logsBox}>{selectedTask.logs}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ARQDashboard;
