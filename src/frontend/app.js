// API configuration
const API_BASE = '/api/v1/arq/tasks';

// DOM elements
const taskForm = document.getElementById('taskForm');
const tasksList = document.getElementById('tasksList');
const refreshBtn = document.querySelector('[onclick="loadTasks()"]');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Load tasks on page load
document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  setupFormHandler();
});

// Setup form submission handler
function setupFormHandler() {
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitTask();
  });
}

// Load tasks from API
async function loadTasks() {
  try {
    console.log('Loading tasks from:', API_BASE);
    const response = await fetch(API_BASE);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const tasks = await response.json();
    console.log('Tasks loaded:', tasks);
    displayTasks(tasks);
  } catch (error) {
    console.error('Error loading tasks:', error);
    tasksList.innerHTML = `
      <div class="empty-message" style="color: #ff6b6b;">
        ❌ Error loading tasks: ${error.message}
      </div>
    `;
  }
}

// Display tasks in the list
function displayTasks(tasks) {
  if (!tasks || tasks.length === 0) {
    tasksList.innerHTML = `
      <div class="empty-message">
        📋 No tasks yet. Create your first task!
      </div>
    `;
    return;
  }
  
  tasksList.innerHTML = tasks.map(task => `
    <div class="task-item">
      <div class="task-header">
        <h3>${task.title || 'Untitled Task'}</h3>
        <span class="priority-badge priority-${task.priority || 'medium'}">
          ${task.priority || 'medium'}
        </span>
      </div>
      <p class="task-description">${task.description || 'No description'}</p>
      <div class="task-meta">
        <span class="status-badge status-${task.status}">${task.status}</span>
        <span class="task-date">Created: ${new Date(task.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  `).join('');
}

// Submit new task
async function submitTask() {
  const submitBtn = taskForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  try {
    // Get form data
    const formData = {
      title: document.getElementById('goal1').value || 'Development Task',
      description: [
        document.getElementById('goal1').value,
        document.getElementById('goal2').value,
        document.getElementById('goal3').value
      ].filter(g => g).join('\n'),
      priority: document.getElementById('priority').value.toLowerCase().split(' ')[1],
      maxIterations: parseInt(document.getElementById('maxIterations').value),
      status: 'pending',
      type: 'development'
    };
    
    console.log('Submitting task:', formData);
    
    // Update button state
    submitBtn.disabled = true;
    submitBtn.textContent = '📤 Submitting...';
    
    // Send request
    const response = await fetch(`${API_BASE}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create task: ${response.status} ${errorData}`);
    }
    
    const result = await response.json();
    console.log('Task created:', result);
    
    // Show success message
    showMessage('success', '✅ Task created successfully!');
    
    // Reset form
    taskForm.reset();
    
    // Reload tasks
    await loadTasks();
    
  } catch (error) {
    console.error('Error submitting task:', error);
    showMessage('error', `❌ Error: ${error.message}`);
  } finally {
    // Restore button state
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// Show message
function showMessage(type, message) {
  const messageEl = type === 'error' ? errorMessage : successMessage;
  messageEl.textContent = message;
  messageEl.style.display = 'block';
  
  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 5000);
}

// Make loadTasks available globally for the refresh button
window.loadTasks = loadTasks;
