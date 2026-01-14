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
  
   
 // Get analytics data
 app.get('/api/v1/arq/analytics', (req, res) => {
   const completed = tasksCache.filter(t => t.status === 'completed').length;
   const total = tasksCache.length;
   const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
   const avgDuration = calculateAverageDuration();
   
   const byType = {};
   tasksCache.forEach(task => {
     const type = task.data.taskType || task.type || 'unknown';
     if (!byType[type]) {
       byType[type] = { count: 0, completed: 0, avgDuration: 0 };
     }
     byType[type].count++;
     if (task.status === 'completed') {
       byType[type].completed++;
     }
   });
   
   res.json({
     totalTasks: total,
     completedTasks: completed,
     successRate,
     avgDuration: avgDuration || '0h',
     byType
   });
 });
 
 // Update task status based on elapsed time
 function updateTaskStatuses() {
   const now = new Date();
   tasksCache.forEach(task => {
     if (task.status === 'active' && task.createdAt) {
       const createdTime = new Date(task.createdAt);
const elapsedMinutes = (now.getTime() - new Date(task.createdAt).getTime()) / (1000 * 60);
       const estimatedMinutes = 120; // 2 hours estimated time
       
       if (elapsedMinutes >= estimatedMinutes) {
         task.status = 'completed';
         task.completedAt = now.toISOString();
         task.logs.push({
           timestamp: now.toISOString(),
           message: 'Task completed',
           level: 'success'
         });
       }
     }
   });
   saveTasks();
 }
 
 // Calculate average duration
 function calculateAverageDuration() {
   const completedTasks = tasksCache.filter(t => t.completedAt);
   if (completedTasks.length === 0) return '0h';
   
   const totalMs = completedTasks.reduce((sum, task) => {
     const created = new Date(task.createdAt);
     const completed = new Date(task.completedAt);
return sum + (new Date(completed).getTime() - new Date(created).getTime());
   }, 0);
   
   const avgHours = totalMs / completedTasks.length / (1000 * 60 * 60);
   return avgHours.toFixed(1) + 'h';
 }
 
 // Update statuses periodically
 setInterval(() => {
   updateTaskStatuses();
 }, 30000); // Check every 30 seconds
 
 // Update on startup
 updateTaskStatuses();});
};
