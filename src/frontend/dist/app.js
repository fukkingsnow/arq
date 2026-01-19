const API_BASE = 'https://arq-ai.ru/api/v1/arq';

// WebSocket for real-time updates
class TaskWebSocketService {
  static ws = null;
  static listeners = {};
  static reconnectAttempts = 0;
  static maxReconnect = 5;

  static connect(url = 'wss://arq-ai.ru/api/v1/arq/ws') {
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
    const res = await fetch(`${API_BASE}/tasks/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  static async getTaskStatus(taskId) {
    const res = await fetch(`${API_BASE}/tasks/status/${taskId}`);
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
    <div class="task-card status-${task.status}">
      <div class="task-header">
        <span class="task-id">ID: ${task.id}</span>
        <span class="task-status badge status-${task.status}">${task.status}</span>
      </div>
      ${task.data && task.data.goal ? `<div class="task-goal"><strong>Goal:</strong> ${task.data.goal}</div>` : ''}
      ${task.data && task.data.description ? `<div class="task-description">${task.data.description}</div>` : ''}
      <div class="task-meta">
        <span>Created: ${new Date(task.createdAt).toLocaleString()}</span>
      </div>
      <div class="task-actions">
        ${task.status === 'active' ? `<button onclick="pauseTask('${task.id}')">Pause</button>` : ''}
        ${task.status === 'paused' ? `<button onclick="resumeTask('${task.id}')">Resume</button>` : ''}
        ${(task.status === 'active' || task.status === 'paused') ? `<button onclick="cancelTask('${task.id}')">Cancel</button>` : ''}
      </div>
    </div>
  `).join('');
}

async function loadTasks() {
  try {
    setState({ loading: true, error: null });
    const tasks = await TaskApiService.getTasks();
    setState({ tasks: tasks || [], loading: false });
  } catch (error) {
    setState({ error: `Error: ${error.message}`, loading: false });
  }
}

async function submitTask(e) {
  e.preventDefault();
  try {
    const goal = document.getElementById('goal').value.trim();
    const description = document.getElementById('description').value.trim();
    const taskType = document.getElementById('taskType').value;

    if (!goal) {
      setState({ error: 'Please enter a development goal' });
      return;
    }

    setState({ loading: true, error: null });

    const payload = {
      goal: goal,
      description: description,
      taskType: taskType,
      type: 'development',
      data: {
        goal: goal,
        description: description,
        taskType: taskType
      }
    };

    const data = await TaskApiService.createTask(payload);
    setState({ loading: false });
    document.getElementById('taskForm').reset();
    setTimeout(loadTasks, 500);

    const successMsg = document.getElementById('successMessage');
    successMsg.textContent = `Task created: ${data.taskId || data.id}`;
    successMsg.style.display = 'block';
    setTimeout(() => {
      successMsg.style.display = 'none';
    }, 5000);
  } catch (error) {
    setState({ error: `Error: ${error.message}`, loading: false });
  }
}

async function checkHealth() {
  try {
    const data = await TaskApiService.health();
    const successMsg = document.getElementById('successMessage');
    successMsg.textContent = `✓ Service Healthy`;
    successMsg.style.display = 'block';
    setTimeout(() => {
      successMsg.style.display = 'none';
    }, 5000);
  } catch (error) {
    setState({ error: `Health check failed: ${error.message}` });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('taskForm').addEventListener('submit', submitTask);
  window.loadTasks = loadTasks;
  window.checkHealth = checkHealth;
  loadTasks();
  setInterval(loadTasks, 10000);
});

render();

// Task Action Functions - Backend API Integration
async function pauseTask(taskId) {
  try {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/pause`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to pause task: ${response.status}`);
    }

    await loadTasks();
    console.log(`Task ${taskId} paused successfully`);
  } catch (error) {
    console.error('Error pausing task:', error);
    alert('Failed to pause task: ' + error.message);
  }
}

async function resumeTask(taskId) {
  try {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/resume`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to resume task: ${response.status}`);
    }

    await loadTasks();
    console.log(`Task ${taskId} resumed successfully`);
  } catch (error) {
    console.error('Error resuming task:', error);
    alert('Failed to resume task: ' + error.message);
  }
}

async function cancelTask(taskId) {
  try {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel task: ${response.status}`);
    }

    await loadTasks();
    console.log(`Task ${taskId} cancelled successfully`);
  } catch (error) {
    console.error('Error cancelling task:', error);
    alert('Failed to cancel task: ' + error.message);
  }
}

// Export functions to window
window.pauseTask = pauseTask;
window.resumeTask = resumeTask;
window.cancelTask = cancelTask;
