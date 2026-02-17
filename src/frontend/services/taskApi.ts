// Task API Service Layer - Phase 41
// Handles all communication with backend API for task management

const API_BASE = '/api/v1';

// TypeScript Interfaces
export interface Task {
  id: string;
  goal: string;
  description: string;
  type: 'bug' | 'feature' | 'refactor' | 'research';
  tags: string[];
  status: 'active' | 'paused' | 'completed' | 'cancelled' | 'failed';
  createdAt: string;
  duration: number;
  executionTime?: number;
}

export interface CreateTaskDTO {
  goal: string;
  description: string;
  type: string;
  tags: string[];
}

export interface UpdateTaskDTO {
  status?: string;
  duration?: number;
  [key: string]: any;
}

/**
 * Task API Service
 * Provides methods to interact with the backend Task API
 */
export class TaskApiService {
  /**
   * Get all tasks from the server
   */
  static async getTasks(): Promise<Task[]> {
    try {
      const response = await fetch(`${API_BASE}/tasks`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  /**
   * Create a new task
   */
  static async createTask(data: CreateTaskDTO): Promise<Task> {
    try {
      const response = await fetch(`${API_BASE}/tasks/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: data.type,
          data: {
            goal: data.goal,
            description: data.description,
            tags: data.tags,
          },
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * Get task by ID
   */
  static async getTask(id: string): Promise<Task> {
    try {
      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching task ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update task status or other properties
   */
  static async updateTask(id: string, data: UpdateTaskDTO): Promise<Task> {
    try {
      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error updating task ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete task
   */
  static async deleteTask(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      console.error(`Error deleting task ${id}:`, error);
      throw error;
    }
  }

  /**
   * Health check - verify API is online
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Export for use in components
export default TaskApiService;
