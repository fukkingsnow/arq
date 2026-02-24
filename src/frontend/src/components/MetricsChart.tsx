MetricsChart.tsximport React, { useState, useEffect } from 'react';
import './MetricsChart.css';

interface MetricsData {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  successRate: number;
  averageExecutionTime: number;
}

export const MetricsChart: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/metrics/dashboard');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.overview);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!metrics) {
    return (
      <div className="metrics-container">
        <div className="metrics-loading">Loading metrics...</div>
      </div>
    );
  }

  return (
    <div className="metrics-container">
      <div className="metrics-header">
        <h2>📊 Performance Metrics</h2>
        <button onClick={fetchMetrics} disabled={loading} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="metrics-grid">
        {/* Total Tasks Card */}
        <div className="metric-card total">
          <div className="metric-label">Total Tasks</div>
          <div className="metric-value">{metrics.totalTasks}</div>
          <div className="metric-bar">
            <div className="metric-progress" style={{width: '100%'}}></div>
          </div>
        </div>

        {/* Completed Tasks Card */}
        <div className="metric-card completed">
          <div className="metric-label">✓ Completed</div>
          <div className="metric-value">{metrics.completedTasks}</div>
          <div className="metric-bar">
            <div className="metric-progress success" style={{width: `${(metrics.completedTasks / metrics.totalTasks) * 100}%`}}></div>
          </div>
        </div>

        {/* Failed Tasks Card */}
        <div className="metric-card failed">
          <div className="metric-label">✗ Failed</div>
          <div className="metric-value">{metrics.failedTasks}</div>
          <div className="metric-bar">
            <div className="metric-progress error" style={{width: `${(metrics.failedTasks / metrics.totalTasks) * 100}%`}}></div>
          </div>
        </div>

        {/* Success Rate Card */}
        <div className="metric-card success-rate">
          <div className="metric-label">Success Rate</div>
          <div className="metric-value">{metrics.successRate.toFixed(1)}%</div>
          <div className="circular-progress">
            <svg width="100" height="100">
              <circle cx="50" cy="50" r="45" className="progress-bg" />
              <circle
                cx="50"
                cy="50"
                r="45"
                className="progress-circle"
                style={{
                  strokeDasharray: `${(metrics.successRate / 100) * 282.7} 282.7`,
                }}
              />
            </svg>
            <div className="progress-percent">{metrics.successRate.toFixed(0)}%</div>
          </div>
        </div>

        {/* Execution Time Card */}
        <div className="metric-card execution-time">
          <div className="metric-label">Avg. Execution Time</div>
          <div className="metric-value">{metrics.averageExecutionTime}ms</div>
          <div className="metric-description">Average processing time per task</div>
        </div>
      </div>
    </div>
  );
};
