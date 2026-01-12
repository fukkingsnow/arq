import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TASKS_FILE = join(process.cwd(), 'data', 'tasks.json');
let tasksCache = [];

// Load tasks from file on startup
if (existsSync(TASKS_FILE)) {
  try {
    const content = readFileSync(TASKS_FILE, 'utf8');
    tasksCache = JSON.parse(content);
  } catch (err) {
    console.error('Error loading tasks:', err);
    tasksCache = [];
  }
}

function saveTasks() {
  try {
    writeFileSync(TASKS_FILE, JSON.stringify(tasksCache, null, 2));
  } catch (err) {
    console.error('Error saving tasks:', err);
  }
}

export const taskControllerRoutes = (app) => {
  // Submit new task
  app.post('/api/v1/arq/tasks/submit', (req, res) => {
    const { type, data, goal, description, taskType } = req.body;
    
    const taskId = `task_${Date.now()}`;
    const task = {
      id: taskId,
      type,
      data: data || { goal, description, taskType },
      status: 'active',
      createdAt: new Date().toISOString(),
      logs: [
        {
          timestamp: new Date().toISOString(),
          message: 'Task initialized',
          level: 'info'
        },
        {
          timestamp: new Date().toISOString(),
          message: 'Execution started',
          level: 'info'
        },
        {
          timestamp: new Date().toISOString(),
          message: 'Processing... (estimated time: 2h)',
          level: 'warning'
        }
      ]
    };
    
    tasksCache.push(task);
    saveTasks();
    
    res.status(202).json({
      taskId,
      status: 'accepted',
      message: 'Task submitted successfully'
    });
  });
  
  // Get all tasks
  app.get('/api/v1/arq/tasks', (req, res) => {
    res.json(tasksCache);
  });
  
  // Get task status
  app.get('/api/v1/arq/tasks/status/:taskId', (req, res) => {
    const task = tasksCache.find(t => t.id === req.params.taskId);
    if (task) {
      res.json({
        taskId: req.params.taskId,
        status: task.status,
        data: task.data,
        logs: task.logs
      });
    } else {
      res.status(404).json({
        taskId: req.params.taskId,
        status: 'not_found',
        message: 'Task not found'
      });
    }
  });
};
