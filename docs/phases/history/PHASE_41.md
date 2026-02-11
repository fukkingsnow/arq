# Phase 41: AI Assistant Interface & Real Backend Integration

## Overview
Phase 41 focuses on replacing the local storage implementation with real backend API integration and implementing the AI Assistant interface.

## Status
- ✅ Backend API endpoints exist (`/api/tasks`)
- ✅ Database models ready
- ❌ Frontend API service layer not connected
- ❌ AI Assistant UI not implemented

## Key Tasks

### 1. Create Task API Service Layer
**File**: `src/frontend/services/taskApi.ts`

```typescript
const API_BASE = '/api';

export class TaskApiService {
  // Get all tasks
  static async getTasks(): Promise<Task[]> {
    const response = await fetch(`${API_BASE}/tasks`);
    return response.json();
  }
  
  // Create task
  static async createTask(data: CreateTaskDTO): Promise<Task> {
    const response = await fetch(`${API_BASE}/tasks/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
  
  // Update task
  static async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
  
  // Delete task
  static async deleteTask(id: string): Promise<void> {
    await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE'
    });
  }
}
```

### 2. Implement AI Assistant Component
**File**: `src/frontend/components/AIAssistant.tsx`

Replace placeholder with:
- Chat interface with message history
- Input field for user queries
- Real-time response rendering
- Task analysis suggestions

### 3. Integrate Backend Storage
Replace localStorage calls with TaskApiService:
- Load tasks from `/api/tasks` on mount
- Use POST to create tasks
- Use PUT to update tasks
- Use DELETE to remove tasks

### 4. Add WebSocket Support
**File**: `src/frontend/services/websocket.ts`

For real-time updates:
```typescript
const ws = new WebSocket('ws://api.arq-ai.ru/api/tasks/subscribe');
ws.on('taskUpdated', (task) => updateUI(task));
```

### 5. Update Frontend State Management
Migrate from localStorage to React Query/SWR:
- Better cache management
- Automatic refetching
- Optimistic updates

## Backend Endpoints to Use

- `POST /api/tasks/submit` - Create task
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/health` - Health check (already working!)

## Testing Checklist

- [ ] API service layer working
- [ ] Tasks load from database on page load
- [ ] Create task persists to database
- [ ] Update task works from UI
- [ ] Delete task removes from database
- [ ] AI Assistant chat renders
- [ ] Real-time updates via WebSocket
- [ ] Error handling for network failures

## Next Steps (Phase 42)

1. Advanced Analytics with charts
2. GitHub integration for auto-task creation
3. Email notifications
4. Task templates
5. Team collaboration features

---

**Started**: Dec 30, 2025
**Target Completion**: Dec 31, 2025
**Assigned**: ARQ Development Team
