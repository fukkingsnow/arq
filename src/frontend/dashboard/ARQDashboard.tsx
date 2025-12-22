import React, { useEffect, useState } from 'react';
import styles from './ARQDashboard.module.css';
import TaskMonitor from './TaskMonitor';
import HealthCheckModal from '../components/HealthCheckModal';
import AssistantChat from '../components/AssistantChat/AssistantChat';
import type { Task } from '../types/task';

interface Task {
  taskId: string;
  title: string;
  status: 'queued' | 'in_progress' | 'completed';
  branch: string;
  createdAt: string;
  developmentGoals: string[];
  result?: any;
  logs?: string;
  iterationCurrent?: number;
  iterationsMax?: number;
}

export const ARQDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'MEN' });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'details'>('list');
  const [taskStartTimes, setTaskStartTimes] = useState<Record<string, number>>({}); 
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

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
    try {
      const res = await fetch('https://arq-ai.ru/api/v1/arq/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formData.title, description: formData.description, priority: formData.priority }),
      });
      const newTask = await res.json();
      setTasks([...tasks, newTask]);
      setFormData({ title: '', description: '', priority: 'MEN' });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.main}>
        {/* Left sidebar - Task list */}
        <div className={styles.taskList}>
          <h2>Tasks</h2>
          <form onSubmit={handleCreateTask}>
            <input
              type="text"
              placeholder="Task title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="LOW">Low</option>
              <option value="MEN">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <button type="submit">Create Task</button>
          </form>

          {tasks.map((task) => (
            <div
              key={task.taskId}
              className={`${styles.taskItem} ${selectedTask?.taskId === task.taskId ? styles.active : ''}`}
              onClick={() => {
                setSelectedTask(task);
                setActiveTab('details');
              }}
            >
              <h3>{task.title}</h3>
              <p>Status: {task.status}</p>
            </div>
          ))}
        </div>

        {/* Center - Task Monitor */}
        <div className={styles.monitor}>
          <TaskMonitor />
          <button
            className={styles.healthBtn}
            onClick={() => setShowHealthModal(true)}
          >
            Check Health
          </button>
        </div>

        {/* Right sidebar - Assistant Chat */}
        <div className={styles.rightSidebar}>
          {chatOpen && selectedTask ? (
            <AssistantChat
              taskId={selectedTask.taskId}
              onClose={() => setChatOpen(false)}
            />
          ) : (
            <button
              className={styles.openChatBtn}
              onClick={() => setChatOpen(true)}
              disabled={!selectedTask}
            >
              {selectedTask ? 'Open Chat' : 'Select a task to chat'}
            </button>
          )}
        </div>
      </div>

      {/* Health Check Modal */}
      {showHealthModal && (
        <HealthCheckModal onClose={() => setShowHealthModal(false)} />
      )}
    </div>
  );
};

export default ARQDashboard;
