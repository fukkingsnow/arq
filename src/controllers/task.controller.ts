import { Controller, Get, Post, Body, Param, HttpStatus, HttpCode, Res, Delete } from '@nestjs/common';import { Response } from 'express';
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

// Update task status based on elapsed time
function updateTaskStatuses() {
  const now = new Date();
  tasksCache.forEach(task => {
    if (task.status === 'active' && task.createdAt) {
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
    return sum + (completed.getTime() - created.getTime());
  }, 0);
  
  const avgHours = totalMs / completedTasks.length / (1000 * 60 * 60);
  return avgHours.toFixed(1) + 'h';
}

// Start periodic status updates
setInterval(() => {
  updateTaskStatuses();
}, 30000); // Check every 30 seconds

// Update on startup
updateTaskStatuses();

@Controller('api/v1/arq')
export class TaskController {
  @Post('tasks/submit')
  @HttpCode(HttpStatus.ACCEPTED)
  submitTask(@Body() body: any, @Res() res: Response) {
    console.log('POST /api/v1/arq/tasks/submit - Body:', body);
    
    const { type, data, goal, description, taskType } = body;
    
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
  }
  
  @Get('tasks')
  getTasks() {
    console.log('GET /api/v1/arq/tasks - Returning', tasksCache.length, 'tasks');
    return tasksCache;
  }
  
  @Get('tasks/status/:taskId')
  getTaskStatus(@Param('taskId') taskId: string) {
    const task = tasksCache.find(t => t.id === taskId);
    if (task) {
      return {
        taskId,
        status: task.status,
        data: task.data,
        logs: task.logs
      };
    } else {
      return {
        taskId,
        status: 'not_found',
        message: 'Task not found'
      };
    }
  }
  
  @Get('analytics')
  getAnalytics() {
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
    
    return {
      totalTasks: total,
      completedTasks: completed,
      successRate,
      avgDuration: avgDuration || '0h',
      byType
    };
      }

      // Complete task manually
  @Post('tasks/:taskId/complete')
  @HttpCode(HttpStatus.OK)
  completeTask(@Param('taskId') taskId: string, @Res() res: Response) {
    const task = tasksCache.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      task.logs.push({
        timestamp: new Date().toISOString(),
        message: 'Task manually completed',
        level: 'success'
      });
      saveTasks();
      res.status(200).json({
        taskId,
        status: 'completed',
        message: 'Task completed successfully'
      });
    } else {
      res.status(404).json({
        taskId,
        status: 'not_found',
        message: 'Task not found'
      });
    }
  }

  // Delete single task
  @Delete('tasks/:taskId')
  @HttpCode(HttpStatus.OK)
  deleteTask(@Param('taskId') taskId: string) {
    const initialLength = tasksCache.length;
    tasksCache = tasksCache.filter(t => t.id !== taskId);
    const deleted = initialLength !== tasksCache.length;
    
    if (deleted) {
      saveTasks();
      return {
        message: 'Task deleted successfully',
        taskId
      };
    } else {
      return {
        message: 'Task not found',
        taskId
      };
    }
  }

  // Clear all tasks
  @Delete('tasks')
  @HttpCode(HttpStatus.OK)
  clearAllTasks() {
    const count = tasksCache.length;
    tasksCache = [];
    saveTasks();
    return {
      message: `All tasks cleared (${count} tasks removed)`,
      count
    };
  }
 }
