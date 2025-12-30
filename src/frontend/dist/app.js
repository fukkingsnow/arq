const API_BASE = 'https://arq-ai.ru/api/v1/arq';

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
