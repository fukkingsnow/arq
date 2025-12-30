// Real-time task updates integration
function initRealtimeUpdates() {
  try {
    TaskWebSocketService.connect().then(() => {
      console.log('[Realtime] WebSocket connected for live updates');
      
      // Listen for task status updates
      TaskWebSocketService.on('taskStatusUpdate', (taskData) => {
        console.log('[Realtime] Task status update received:', taskData);
        
        // Find and update task in state
        const taskIndex = appState.tasks.findIndex(t => t.taskId === taskData.taskId);
        if (taskIndex > -1) {
          appState.tasks[taskIndex] = { ...appState.tasks[taskIndex], ...taskData };
          render();
        }
      });

      // Listen for new task notifications
      TaskWebSocketService.on('taskCreated', (taskData) => {
        console.log('[Realtime] New task notification:', taskData);
        if (!appState.tasks.find(t => t.taskId === taskData.taskId)) {
          appState.tasks.unshift(taskData);
          render();
        }
      });

      // Listen for task completion events
      TaskWebSocketService.on('taskCompleted', (taskData) => {
        console.log('[Realtime] Task completed:', taskData);
        const task = appState.tasks.find(t => t.taskId === taskData.taskId);
        if (task) {
          task.status = 'completed';
          render();
        }
      });
    }).catch(err => {
      console.warn('[Realtime] WebSocket connection failed, falling back to polling');
      // Fallback: keep existing 5s polling
    });
  } catch (err) {
    console.error('[Realtime] Initialization error:', err);
  }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  TaskWebSocketService.disconnect();
});

// Initialize when app starts
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRealtimeUpdates);
} else {
  initRealtimeUpdates();
}
