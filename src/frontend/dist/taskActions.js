// Task Action Functions - Backend API Integration
const API_BASE = '/api/v1/arq';

// Pause Task
async function pauseTask(taskId) {
  try {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/pause`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to pause task: ${response.status}`);
    }
    
    // Reload tasks to reflect changes
    if (typeof loadTasks === 'function') {
      await loadTasks();
    }
    
    console.log(`Task ${taskId} paused successfully`);
  } catch (error) {
    console.error('Error pausing task:', error);
    alert('Failed to pause task: ' + error.message);
  }
}

// Resume Task
async function resumeTask(taskId) {
  try {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/resume`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to resume task: ${response.status}`);
    }
    
    // Reload tasks to reflect changes
    if (typeof loadTasks === 'function') {
      await loadTasks();
    }
    
    console.log(`Task ${taskId} resumed successfully`);
  } catch (error) {
    console.error('Error resuming task:', error);
    alert('Failed to resume task: ' + error.message);
  }
}

// Cancel Task
async function cancelTask(taskId) {
  try {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to cancel task: ${response.status}`);
    }
    
    // Reload tasks to reflect changes
    if (typeof loadTasks === 'function') {
      await loadTasks();
    }
    
    console.log(`Task ${taskId} cancelled successfully`);
  } catch (error) {
    console.error('Error cancelling task:', error);
    alert('Failed to cancel task: ' + error.message);
  }
}

console.log('Task actions module loaded - using backend API');
