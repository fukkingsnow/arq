const API_BASE = 'https://arq-ai.ru/api/v1/arq';

// WebSocket Service (Оставляем как есть, пригодится для стриминга логов)
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

  static reconnect() {
    if (this.reconnectAttempts < this.maxReconnect) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      setTimeout(() => this.connect(), delay);
    }
  }
}

// API Service - Подстроен под наш новый Python Engine
class TaskApiService {
  static async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
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
    const res = await fetch(`${API_BASE}/status/${taskId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
}

let appState = {
  tasks: [],
  loading: false,
  error: null,
  totalTasks: 0
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
    setTimeout(() => { errorMsg.style.display = 'none'; setState({ error: null }); }, 5000);
  }

  if (appState.loading && appState.tasks.length === 0) {
    tasksList.innerHTML = '<div class="empty-message">📡 Synchronizing with ARQ Memory...</div>';
    return;
  }

  if (!appState.tasks || appState.tasks.length === 0) {
    tasksList.innerHTML = '<div class="empty-message">📭 No persistent tasks found. Create one!</div>';
    return;
  }

  // Сортируем задачи, чтобы новые были сверху
  const sortedTasks = [...appState.tasks].reverse();

  tasksList.innerHTML = sortedTasks.map(task => {
    const progress = (task.iterations / (task.goal?.max_iterations || 1)) * 100;
    return `
      <div class="task-item shadow-sm">
        <div class="task-header">
          <span class="task-id"># ${task.task_id}</span>
          <span class="status-badge status-${task.status}">${task.status.toUpperCase()}</span>
        </div>
        <div class="task-goals">
          <strong>Objective:</strong> ${task.goal?.title || 'System Goal'}
        </div>
        <div class="progress-container" style="background: #1e293b; height: 4px; border-radius: 2px; margin: 10px 0;">
          <div class="progress-bar" style="width: ${progress}%; background: #3b82f6; height: 100%; border-radius: 2px; transition: width 0.5s shadow: 0 0 10px #3b82f6;"></div>
        </div>
        <div class="task-meta">
          <span>Cycles: ${task.iterations} / ${task.goal?.max_iterations || 0}</span>
          <span>Last Active: ${new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Загрузка данных из "вечного" хранилища
async function loadTasks() {
  try {
    const data = await TaskApiService.getHealth();
    // Мы ожидаем, что бэкенд отдаст tasks в объекте health (нужно будет добавить в Python)
    // Либо если пока нет списка, показываем статус
    if (data.active_tasks !== undefined) {
      // Здесь временный хак: если бэкенд пока не отдает массив, 
      // мы можем запрашивать его отдельным эндпоинтом, но для начала проверим здоровье
      console.log("System Healthy. Active tasks count:", data.active_tasks);
    }
    
    // ВАЖНО: Мы добавим в Python эндпоинт GET /tasks, чтобы этот метод работал
    const res = await fetch(`${API_BASE}/health`); 
    const healthData = await res.json();
    
    // Для демонстрации: если данных нет, мы их не затираем
    setState({ loading: false });
  } catch (error) {
    console.error("Load error:", error);
    setState({ loading: false });
  }
}

async function submitTask(e) {
  e.preventDefault();
  try {
    const goalTitle = document.getElementById('goal1').value;
    if (!goalTitle) {
      setState({ error: 'Please enter a goal title' });
      return;
    }

    setState({ loading: true, error: null });
    const data = await TaskApiService.createTask({
      title: goalTitle,
      description: "Autonomous cycle started from UI",
      max_iterations: parseInt(document.getElementById('maxIterations').value) || 5,
      priority: document.getElementById('priority').value || "high",
      goals: [goalTitle]
    });

    setState({ loading: false });
    document.getElementById('taskForm').reset();
    
    const successMsg = document.getElementById('successMessage');
    successMsg.textContent = `Task ${data.task_id} initiated and saved to disk.`;
    successMsg.style.display = 'block';
    setTimeout(() => { successMsg.style.display = 'none'; }, 5000);
    
    loadTasks();
  } catch (error) {
    setState({ error: `Submission failed: ${error.message}`, loading: false });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('taskForm');
  if (form) form.addEventListener('submit', submitTask);
  
  // Начальная загрузка
  loadTasks();
  
  // Интервал обновления (только если нужно real-time)
  setInterval(loadTasks, 5000);
});

render();
