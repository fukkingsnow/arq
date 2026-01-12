import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Use /tmp for storing tasks (writable location in Docker)
const DATA_DIR = '/tmp/arq_data';
const TASKS_FILE = join(DATA_DIR, 'tasks.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    console.log('Created data directory:', DATA_DIR);
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

let tasksCache = [];

// Load tasks from file on startup
if (existsSync(TASKS_FILE)) {
  try {
    const content = readFileSync(TASKS_FILE, 'utf8');
    tasksCache = JSON.parse(content);
    console.log('Loaded', tasksCache.length, 'tasks from', TASKS_FILE);
  } catch (err) {
    console.error('Error loading tasks:', err);
    tasksCache = [];
  }
}

function saveTasks() {
  try {
    writeFileSync(TASKS_FILE, JSON.stringify(tasksCache, null, 2));
    console.log('Saved', tasksCache.length, 'tasks to', TASKS_FILE);
  } catch (err) {
    console.error('Error saving tasks:', err);
  }
}

export const taskControllerRoutes = (app) => {
  // Submit new task
  app.post('/api/v1/arq/tasks/submit', (req, res) => {
    console.log('POST /api/v1/arq/tasks/submit - Body:', req.body);
    
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
    
    console.log('Creating task:', taskId);
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
    console.log('GET /api/v1/arq/tasks - Returning', tasksCache.length, 'tasks');
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
