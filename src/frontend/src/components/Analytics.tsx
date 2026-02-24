import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
  completionRate: number;
  avgCompletionTime: number;
}

const Analytics: React.FC = () => {
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    completionRate: 0,
    avgCompletionTime: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
axios.get('/api/v1/arq/tasks')      const tasks = data || [];
      
      const completed = tasks.filter((t: any) => t.status === 'completed').length;
      const pending = tasks.filter((t: any) => t.status === 'pending').length;
      const cancelled = tasks.filter((t: any) => t.status === 'cancelled').length;
      const total = tasks.length;

      const completedTasks = tasks.filter((t: any) => t.status === 'completed');
      const avgTime = completedTasks.length > 0
        ? completedTasks.reduce((sum: number, t: any) => {
            const created = new Date(t.createdAt).getTime();
            const completed = new Date(t.completedAt || t.updatedAt).getTime();
            return sum + (completed - created);
          }, 0) / completedTasks.length / (1000 * 60 * 60)
        : 0;

      setStats({
        total,
        pending,
        completed,
        cancelled,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        avgCompletionTime: Math.round(avgTime * 10) / 10,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ label, value, color }: { label: string; value: any; color: string }) => (
    <div
      style={{
        padding: '20px',
        margin: '10px',
        borderRadius: '8px',
        backgroundColor: color,
        color: 'white',
        minWidth: '150px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '12px', opacity: 0.9 }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px' }}>{value}</div>
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <h2>📊 Task Analytics</h2>
      
      {loading && <p>Loading...</p>}
      
      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '30px' }}>
        <StatCard label="Total Tasks" value={stats.total} color="#5e72e4" />
        <StatCard label="Pending" value={stats.pending} color="#fb6340" />
        <StatCard label="Completed" value={stats.completed} color="#2dce89" />
        <StatCard label="Cancelled" value={stats.cancelled} color="#6c757d" />
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>📈 Performance Metrics</h3>
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginTop: '15px',
        }}>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '14px', color: '#666' }}>Completion Rate</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
              {stats.completionRate}%
            </div>
            <div style={{
              marginTop: '10px',
              height: '8px',
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div
                style={{
                  height: '100%',
                  width: `${stats.completionRate}%`,
                  backgroundColor: '#2dce89',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '14px', color: '#666' }}>Avg Completion Time (hours)</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
              {stats.avgCompletionTime.toFixed(1)}h
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>🔤 Task Distribution</h3>
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginTop: '15px',
        }}>
          {[
            { label: 'Pending', value: stats.pending, percent: stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0, color: '#fb6340' },
            { label: 'Completed', value: stats.completed, percent: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0, color: '#2dce89' },
            { label: 'Cancelled', value: stats.cancelled, percent: stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0, color: '#6c757d' },
          ].map((item) => (
            <div key={item.label} style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>{item.label}</span>
                <span>{item.value} ({item.percent}%)</span>
              </div>
              <div style={{
                marginTop: '8px',
                height: '6px',
                backgroundColor: '#e9ecef',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div
                  style={{
                    height: '100%',
                    width: `${item.percent}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
