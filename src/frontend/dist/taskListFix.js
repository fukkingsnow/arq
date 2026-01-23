// Fix for task list display - show paused tasks and conditional buttons
// This script patches the existing loadTasks and displayTask functions

(function() {
  'use strict';
  
  console.log('[Task Fix] Initializing task list fixes...');

  // Wait for DOM and original functions to load
  window.addEventListener('DOMContentLoaded', function() {
    // Override loadTasks to include paused tasks
    if (typeof window.loadTasks === 'function') {
      const originalLoadTasks = window.loadTasks;
      window.loadTasks = function() {
        const tasks = JSON.parse(localStorage.getItem('arqTasks') || '[]');
        const tasksContainer = document.getElementById('tasksContainer');
        if (!tasksContainer) return;
        
        tasksContainer.innerHTML = '';
        
        // Show both active and paused tasks
        tasks.filter(t => ['active', 'paused'].includes(t.status)).forEach(task => {
          if (typeof window.displayTask === 'function') {
            window.displayTask(task);
          }
        });
      };
      console.log('[Task Fix] loadTasks function patched');
    }

    // Override displayTask to show conditional buttons
    if (typeof window.displayTask === 'function') {
      window.displayTask = function(task) {
        const tasksContainer = document.getElementById('tasksContainer');
        if (!tasksContainer) return;
        
        const card = document.createElement('div');
        card.className = 'task-card';
        if (task.status === 'paused') card.classList.add('task-paused');
        
        const emojis = {bug:'🐛', feature:'✨', refactor:'♻️', research:'🔬'};
        const labels = {bug:'Bug', feature:'Feature', refactor:'Refactor', research:'Research'};
        const date = new Date(task.createdAt).toLocaleDateString();
        
        // Build controls HTML based on task status
        let controlsHTML = '';
        if (task.status === 'active') {
          controlsHTML = `<button class="pause" onclick="pauseTask('${task.id}')">⏸ Pause</button>`;
        } else if (task.status === 'paused') {
          controlsHTML = `<button onclick="resumeTask('${task.id}')">▶ Resume</button>`;
        }
        
        controlsHTML += `
          <button onclick="viewTaskDetails('${task.id}')">👁 Details</button>
          <button class="cancel" onclick="cancelTask('${task.id}')">✕ Cancel</button>
        `;
        
        card.innerHTML = `
          <h4>${task.goal}</h4>
          <p>${task.description || 'No description'}</p>
          <div class="task-meta">
            <span class="task-badge">📅 ${date}</span>
            <span class="task-badge">${emojis[task.type] || ''} ${labels[task.type] || ''}</span>
            <span class="task-badge" style="background: ${task.status === 'paused' ? '#ff9800' : '#4caf50'}; color: white">
              ${task.status === 'paused' ? '⏸ Paused' : '▶ Active'}
            </span>
            ${task.tags.map(tag => `<span class="task-badge">#${tag}</span>`).join('')}
          </div>
          <div class="task-controls">
            ${controlsHTML}
          </div>
        `;
        
        tasksContainer.appendChild(card);
      };
      console.log('[Task Fix] displayTask function patched');
    }

    // Reload tasks to apply fixes
    setTimeout(() => {
      if (typeof window.loadTasks === 'function') {
        window.loadTasks();
        console.log('[Task Fix] Tasks reloaded with fixes applied');
      }
    }, 500);
  });
})();
