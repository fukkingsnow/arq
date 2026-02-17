import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface TaskEvent {
  id: string;
  taskId: string;
  taskTitle: string;
  eventType: 'created' | 'updated' | 'completed' | 'cancelled';
  status: string;
  timestamp: string;
  description?: string;
}

const History: React.FC = () => {
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: 'all', type: 'all' });

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
axios.get('/api/v1/arq/tasks')      const eventList = data
        .map((task: any) => ({
          id: task.id,
          taskId: task.id,
          taskTitle: task.title,
          eventType: task.status === 'completed' ? 'completed' : task.status === 'cancelled' ? 'cancelled' : 'updated',
          status: task.status,
          timestamp: task.updatedAt || task.createdAt,
          description: task.description,
        }))
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setEvents(eventList);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      created: '✨',
      updated: '🔄',
      completed: '✅',
      cancelled: '❌',
    };
    return icons[type] || '📝';
  };

  const filteredEvents = events.filter((event) => {
    if (filters.status !== 'all' && event.status !== filters.status) return false;
    if (filters.type !== 'all' && event.eventType !== filters.type) return false;
    return true;
  });

  return (
    <div style={{ padding: '20px' }}>
      <h2>📜 Task History</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          style={{ padding: '8px', borderRadius: '4px' }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          style={{ padding: '8px', borderRadius: '4px' }}
        >
          <option value="all">All Types</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading && <p>Loading...</p>}
      {filteredEvents.length === 0 ? (
        <p>No events found</p>
      ) : (
        <div>
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              style={{
                padding: '15px',
                margin: '10px 0',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
              }}
            >
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                📅 {new Date(event.timestamp).toLocaleString()}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                {getEventIcon(event.eventType)} {event.taskTitle}
              </div>
              <div style={{ fontSize: '14px' }}>
                Status: <span style={{ fontWeight: 'bold' }}>{event.status}</span>
              </div>
              {event.description && (
                <div style={{ fontSize: '13px', color: '#555', marginTop: '8px' }}>
                  {event.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
