const API_BASE = 'https://arq-ai.ru/api/v1/tasksarq';

// WebSocket for real-time updates
class TaskWebSocketService {
  static ws = null;
  static listeners = {};
  static reconnectAttempts = 0;
  static maxReconnect = 5;

  static connect(url = 'wss://arq-ai.ru/api/v1/tasksarq/ws') {
    if (this.ws) return Promise.resolve();
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
        this.ws.onopen = () => {
          console.log('[WS] Connected');
          this.reconnectAttempts = 0;
          resolve();
        };
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const { type, data } = message;
            if (this.listeners[type]) {
              this.listeners[type].forEach(cb => cb(data));
            }
          } catch (e) {
            console.error('[WS] Parse error:', e);
          }
        };
        this.ws.onerror = (error) => {
          console.error('[WS] Error:', error);
          reject(error);
        };
        this.ws.onclose = () => {
          console.log('[WS] Disconnected');
          this.ws = null;
          this.reconnect();
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  static disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  static on(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  static off(type, callback) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    }
  }

  static send(type, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('[WS] Not connected');
    }
  }

  static reconnect() {
    if (this.reconnectAttempts < this.maxReconnect) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      console.log(`[WS] Reconnecting in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    }
  }

  static isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

class TaskApiService {
  static async getTasks() {
    const res = await fetch(`${API_BASE}/tasks`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  static async createTask(payload) {
    const res = await fetch(`${API_BASE}/start-development`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  static async getTaskStatus(taskId) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  static async health() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
}

let appState = {
  tasks: [],
  loading: false,
  error: null
};

function setState(updates) {
  appState = { ...appState, ...updates };
  render();
}

function render() {
  const tasksList = document.getElementById('tasksList');
  const errorMsg = document.getElementById('errorMessage');
  const successMsg = document.getElementById('successMessage');

  if (appState.error) {
    errorMsg.textContent = appState.error;
    errorMsg.style.display = 'block';
    setTimeout(() => {
      errorMsg.style.display = 'none';
      setState({ error: null });
    }, 5000);
  }

  if (appState.loading) {
    tasksList.innerHTML = '<div class="empty-message">Loading tasks...</div>';
    return;
  }

  if (!appState.tasks || appState.tasks.length === 0) {
    tasksList.innerHTML = '<div class="empty-message">📭 No tasks yet. Create one to get started!</div>';
    return;
  }

  tasksList.innerHTML = appState.tasks.map(task => `
    <div class="task-item">
      <div class="task-header">
        <span class="task-id">ID: ${task.taskId}</span>
        <span class="status-badge status-${task.status}">${task.status}</span>
      </div>
      ${task.developmentGoals ? `<div class="task-goals"><strong>Goals:</strong> ${task.developmentGoals.join(', ')}</div>` : ''}
      <div class="task-meta">
        <span>Created: ${new Date(task.createdAt).toLocaleString()}</span>
        <span>Branch: <code>${task.branch || 'N/A'}</code></span>
      </div>
    </div>
  `).join('');
}

async function loadTasks() {
  try {
    setState({ loading: true, error: null });
    const data = await TaskApiService.getTasks();
    setState({ tasks: data.tasks || [], loading: false });
  } catch (error) {
    setState({ error: `Error: ${error.message}`, loading: false });
  }
}

async function submitTask(e) {
  e.preventDefault();
  try {
    const goals = [
      document.getElementById('goal1').value,
      document.getElementById('goal2').value,
      document.getElementById('goal3').value
    ].filter(g => g.trim());

    if (goals.length === 0) {
      setState({ error: 'Please enter at least one development goal' });
      return;
    }

    setState({ loading: true, error: null });
    const data = await TaskApiService.createTask({
      developmentGoals: goals,
      maxIterations: parseInt(document.getElementById('maxIterations').value),
      priority: document.getElementById('priority').value
    });

    setState({ loading: false });
    document.getElementById('taskForm').reset();
    setTimeout(loadTasks, 500);
    
    const successMsg = document.getElementById('successMessage');
    successMsg.textContent = `Task created: ${data.taskId}`;
    successMsg.style.display = 'block';
    setTimeout(() => { successMsg.style.display = 'none'; }, 5000);
  } catch (error) {
    setState({ error: `Error: ${error.message}`, loading: false });
  }
}

async function checkHealth() {
  try {
    const data = await TaskApiService.health();
    const successMsg = document.getElementById('successMessage');
    successMsg.textContent = `✓ Service Healthy - ${data.activeTasks} active tasks`;
    successMsg.style.display = 'block';
    setTimeout(() => { successMsg.style.display = 'none'; }, 5000);
  } catch (error) {
    setState({ error: `Health check failed: ${error.message}` });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('taskForm').addEventListener('submit', submitTask);
  window.loadTasks = loadTasks;
  window.checkHealth = checkHealth;
  loadTasks();
  setInterval(loadTasks, 5000);
});

render();
