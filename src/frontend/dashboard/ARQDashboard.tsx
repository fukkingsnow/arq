// @ts-nocheck
import React, { useState, useEffect } from 'react';

interface Task {
  taskId: string;
  status: 'queued' | 'in_progress' | 'completed';
  branch: string;
  createdAt: string;
  developmentGoals: string[];
}

interface DashboardState {
  totalTasks: number;
  activeTasks: Task[];
  systemHealth: {
    status: string;
    uptime: number;
    responseTime: number;
  };
}

export const ARQDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardState>({
    totalTasks: 0,
    activeTasks: [],
    systemHealth: { status: 'offline', uptime: 0, responseTime: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch tasks
        const tasksResponse = await fetch('https://arq-ai.ru/api/v1/arq/tasks');
        const tasksData = await tasksResponse.json();

        // Fetch health
        const healthResponse = await fetch('https://arq-ai.ru/api/v1/arq/health');
        const healthData = await healthResponse.json();

        setDashboard({
          totalTasks: tasksData.total || 0,
          activeTasks: tasksData.tasks || [],
          systemHealth: {
            status: healthData.status || 'offline',
            uptime: healthData.uptime || 0,
            responseTime: healthData.responseTime || 0,
          },
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="dashboard-loading">Loading ARQ Dashboard...</div>;
  }

  return (
    <div className="arq-dashboard">
      <header className="dashboard-header">
        <h1>🚀 ARQ Self-Development Engine Dashboard</h1>
        <div className="system-status">
          <span className={`status-badge ${dashboard.systemHealth.status}`}>
            {dashboard.systemHealth.status.toUpperCase()}
          </span>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* System Health Section */}
        <section className="card system-health">
          <h2>System Health</h2>
          <div className="health-metrics">
            <div className="metric">
              <label>Status:</label>
              <span>{dashboard.systemHealth.status}</span>
            </div>
            <div className="metric">
              <label>Response Time:</label>
              <span>{dashboard.systemHealth.responseTime}ms</span>
            </div>
            <div className="metric">
              <label>Active Tasks:</label>
              <span className="badge-primary">{dashboard.totalTasks}</span>
            </div>
          </div>
        </section>

        {/* Development Tasks Section */}
        <section className="card development-tasks">
          <h2>Development Tasks ({dashboard.totalTasks})</h2>
          <div className="tasks-list">
            {dashboard.activeTasks.length > 0 ? (
              dashboard.activeTasks.map((task) => (
                <div key={task.taskId} className="task-card">
                  <div className="task-header">
                    <h3>{task.taskId}</h3>
                    <span className={`status-badge ${task.status}`}>
                      {task.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="task-details">
                    <p><strong>Branch:</strong> {task.branch}</p>
                    <p><strong>Created:</strong> {new Date(task.createdAt).toLocaleString()}</p>
                    <div className="goals">
                      <strong>Goals:</strong>
                      <ul>
                        {task.developmentGoals.map((goal, idx) => (
                          <li key={idx}>{goal}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-tasks">No active tasks</p>
            )}
          </div>
        </section>
      </div>

      {/* Action Buttons */}
      <div className="dashboard-actions">
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          🔄 Refresh Dashboard
        </button>
        <button className="btn btn-success" onClick={() => alert('New task creation UI coming soon!')}>
          ➕ Start New Task
        </button>
      </div>

      <style jsx>{`
        .arq-dashboard {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          color: white;
        }

        .dashboard-header h1 {
          font-size: 32px;
          margin: 0;
        }

        .system-status {
          display: flex;
          gap: 16px;
        }

        .status-badge {
          padding: 8px 16px;
          border-radius: 24px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 12px;
        }

        .status-badge.healthy,
        .status-badge.in_progress {
          background: #10b981;
          color: white;
        }

        .status-badge.offline {
          background: #ef4444;
          color: white;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .card h2 {
          margin: 0 0 16px 0;
          font-size: 20px;
          color: #1f2937;
        }

        .health-metrics {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f3f4f6;
          border-radius: 8px;
        }

        .metric label {
          font-weight: 600;
          color: #4b5563;
        }

        .metric span {
          font-size: 18px;
          font-weight: bold;
          color: #667eea;
        }

        .badge-primary {
          background: #667eea;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: bold;
        }

        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .task-card {
          border-left: 4px solid #667eea;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .task-header h3 {
          margin: 0;
          font-size: 16px;
          color: #1f2937;
        }

        .task-details p {
          margin: 4px 0;
          font-size: 14px;
          color: #6b7280;
        }

        .goals {
          margin-top: 8px;
        }

        .goals strong {
          display: block;
          margin-bottom: 8px;
          color: #1f2937;
        }

        .goals ul {
          margin: 0;
          padding-left: 20px;
          list-style: none;
        }

        .goals li {
          padding: 4px 0;
          color: #4b5563;
        }

        .goals li:before {
          content: '✓ ';
          color: #10b981;
          font-weight: bold;
          margin-right: 8px;
        }

        .no-tasks {
          text-align: center;
          color: #9ca3af;
          padding: 24px;
        }

        .dashboard-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: white;
          color: #667eea;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
        }

        .btn-success {
          background: #10b981;
          color: white;
        }

        .btn-success:hover {
          background: #059669;
          transform: translateY(-2px);
        }

        .dashboard-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 24px;
          color: #667eea;
        }

        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 16px;
          }

          .dashboard-header h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default ARQDashboard;
