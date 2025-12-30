// Phase 49: Real-Time Metrics Dashboard
// Visualizes performance monitoring data with charts and alerts

class MetricsDashboard {
  constructor() {
    this.dashboardElement = null;
    this.updateInterval = 2000; // Update every 2 seconds
    this.alertThresholds = {
      apiSlowResponse: 500,
      wsHighLatency: 100,
      memoryWarning: 100,
      memoryCritical: 140
    };
    this.alerts = [];
    this.maxAlerts = 10;
  }

  init(containerId = 'metrics-dashboard') {
    this.createDashboardHTML();
    this.dashboardElement = document.getElementById(containerId);
    if (this.dashboardElement) {
      this.startAutoUpdate();
      console.log('✓ Metrics Dashboard initialized');
    } else {
      console.warn('Dashboard container not found');
    }
  }

  createDashboardHTML() {
    if (!document.body) return;
    
    const style = document.createElement('style');
    style.textContent = `
      #metrics-dashboard {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #0f172a;
        color: #e2e8f0;
        padding: 20px;
        border-radius: 12px;
        margin: 20px 0;
        border: 1px solid #1e293b;
      }
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
      }
      .metric-card {
        background: #1e293b;
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid #0ea5e9;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .metric-card.warning { border-left-color: #f59e0b; }
      .metric-card.critical { border-left-color: #ef4444; }
      .metric-card.success { border-left-color: #10b981; }
      .metric-label {
        font-size: 12px;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }
      .metric-value {
        font-size: 28px;
        font-weight: 700;
        color: #e2e8f0;
        margin-bottom: 4px;
      }
      .metric-unit {
        font-size: 12px;
        color: #64748b;
        margin-left: 4px;
      }
      .metric-status {
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 4px;
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        width: fit-content;
        margin-top: 8px;
      }
      .metric-status.warning {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }
      .metric-status.critical {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }
      .alerts-section {
        background: #1e293b;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        border-left: 4px solid #64748b;
      }
      .alerts-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 10px;
        color: #cbd5e1;
      }
      .alert-item {
        padding: 8px 12px;
        margin-bottom: 8px;
        border-radius: 4px;
        background: rgba(239, 68, 68, 0.1);
        border-left: 3px solid #ef4444;
        font-size: 12px;
        color: #fca5a5;
      }
      .alert-item.warning {
        background: rgba(245, 158, 11, 0.1);
        border-left-color: #f59e0b;
        color: #fcd34d;
      }
      .chart-container {
        background: #1e293b;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        height: 250px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
      }
      .controls {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
      }
      .btn-control {
        padding: 8px 16px;
        background: #0ea5e9;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.3s;
      }
      .btn-control:hover { background: #0284c7; }
      .btn-control.secondary {
        background: #64748b;
      }
      .btn-control.secondary:hover { background: #475569; }
    `;
    document.head.appendChild(style);
  }

  startAutoUpdate() {
    setInterval(() => {
      this.updateMetrics();
    }, this.updateInterval);
  }

  updateMetrics() {
    const monitor = window.performanceMonitor;
    if (!monitor) return;

    const summary = monitor.getMetricsSummary();
    this.renderDashboard(summary);
    this.checkThresholds(summary);
  }

  renderDashboard(summary) {
    if (!this.dashboardElement) return;

    const html = `
      <div class="controls">
        <button class="btn-control" onclick="metricsDashboard.exportData()">Export Metrics</button>
        <button class="btn-control secondary" onclick="metricsDashboard.clearAlerts()">Clear Alerts</button>
        <button class="btn-control secondary" onclick="metricsDashboard.toggleAutoRefresh()">Pause Updates</button>
      </div>

      <div class="metrics-grid">
        ${this.renderMetricCard('API Response', summary.apiAvg, 'ms', 
          summary.apiAvg > this.alertThresholds.apiSlowResponse ? 'warning' : 'success')}
        ${this.renderMetricCard('API Count', summary.apiCount || 0, 'requests', 'success')}
        ${this.renderMetricCard('Memory Used', (summary.memoryUsed || 0).toFixed(1), 'MB',
          summary.memoryUsed > this.alertThresholds.memoryCritical ? 'critical' :
          summary.memoryUsed > this.alertThresholds.memoryWarning ? 'warning' : 'success')}
        ${this.renderMetricCard('WS Latency', summary.wsAvgLatency || 0, 'ms',
          summary.wsAvgLatency > this.alertThresholds.wsHighLatency ? 'warning' : 'success')}
        ${this.renderMetricCard('Task Operations', summary.totalTaskOps || 0, 'ops', 'success')}
        ${this.renderMetricCard('AI Avg Response', summary.aiAvgDuration || 0, 'ms', 'success')}
      </div>

      ${this.renderAlertsSection()}

      <div class="chart-container">
        <div>📊 Chart rendering (requires chart.js integration)</div>
      </div>

      <div style="font-size: 11px; color: #64748b; text-align: right;">
        Updated: ${new Date().toLocaleTimeString()}
      </div>
    `;

    this.dashboardElement.innerHTML = html;
  }

  renderMetricCard(label, value, unit, status = 'success') {
    return `
      <div class="metric-card ${status}">
        <div>
          <div class="metric-label">${label}</div>
          <div style="display: flex; align-items: baseline;">
            <div class="metric-value">${typeof value === 'number' ? value.toFixed(1) : value}</div>
            <div class="metric-unit">${unit}</div>
          </div>
        </div>
        <div class="metric-status ${status}">
          ${status === 'warning' ? '⚠️ Warning' : status === 'critical' ? '🚨 Critical' : '✓ Normal'}
        </div>
      </div>
    `;
  }

  renderAlertsSection() {
    if (this.alerts.length === 0) {
      return `<div class="alerts-section">
        <div class="alerts-title">✓ No Alerts</div>
        <div style="font-size: 12px; color: #64748b;">System is operating normally</div>
      </div>`;
    }

    return `<div class="alerts-section">
      <div class="alerts-title">🔔 Alerts (${this.alerts.length})</div>
      ${this.alerts.map(alert => 
        `<div class="alert-item ${alert.type}">${alert.timestamp} - ${alert.message}</div>`
      ).join('')}
    </div>`;
  }

  checkThresholds(summary) {
    const newAlerts = [];

    // Check API response time
    if (summary.apiAvg > this.alertThresholds.apiSlowResponse) {
      newAlerts.push({
        type: 'warning',
        message: `API response time high: ${summary.apiAvg.toFixed(0)}ms (threshold: ${this.alertThresholds.apiSlowResponse}ms)`,
        timestamp: new Date().toLocaleTimeString()
      });
    }

    // Check WebSocket latency
    if (summary.wsAvgLatency && summary.wsAvgLatency > this.alertThresholds.wsHighLatency) {
      newAlerts.push({
        type: 'warning',
        message: `WS latency high: ${summary.wsAvgLatency.toFixed(0)}ms (threshold: ${this.alertThresholds.wsHighLatency}ms)`,
        timestamp: new Date().toLocaleTimeString()
      });
    }

    // Check memory usage
    if (summary.memoryUsed > this.alertThresholds.memoryCritical) {
      newAlerts.push({
        type: 'critical',
        message: `Memory critical: ${summary.memoryUsed.toFixed(1)}MB (limit: ${this.alertThresholds.memoryCritical}MB)`,
        timestamp: new Date().toLocaleTimeString()
      });
    } else if (summary.memoryUsed > this.alertThresholds.memoryWarning) {
      newAlerts.push({
        type: 'warning',
        message: `Memory warning: ${summary.memoryUsed.toFixed(1)}MB (warning: ${this.alertThresholds.memoryWarning}MB)`,
        timestamp: new Date().toLocaleTimeString()
      });
    }

    // Add new alerts
    for (const alert of newAlerts) {
      const exists = this.alerts.some(a => a.message === alert.message);
      if (!exists) {
        this.alerts.unshift(alert);
      }
    }

    // Keep only recent alerts
    this.alerts = this.alerts.slice(0, this.maxAlerts);
  }

  exportData() {
    const monitor = window.performanceMonitor;
    if (!monitor) {
      alert('Performance monitor not available');
      return;
    }

    const data = monitor.exportMetrics();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrics-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  clearAlerts() {
    this.alerts = [];
    this.updateMetrics();
  }

  toggleAutoRefresh() {
    // Implementation for toggling auto-refresh
    console.log('Auto-refresh toggled');
  }

  getThresholdStatus(metric, value) {
    const thresholds = this.alertThresholds;
    if (metric === 'apiResponse' && value > thresholds.apiSlowResponse) return 'warning';
    if (metric === 'wsLatency' && value > thresholds.wsHighLatency) return 'warning';
    if (metric === 'memory' && value > thresholds.memoryCritical) return 'critical';
    if (metric === 'memory' && value > thresholds.memoryWarning) return 'warning';
    return 'success';
  }
}

const metricsDashboard = new MetricsDashboard();
window.metricsDashboard = metricsDashboard;

// Auto-initialize dashboard if container exists
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('metrics-dashboard')) {
      metricsDashboard.init();
    }
  });
} else if (document.getElementById('metrics-dashboard')) {
  metricsDashboard.init();
}

console.log('✓ Metrics Dashboard loaded');
