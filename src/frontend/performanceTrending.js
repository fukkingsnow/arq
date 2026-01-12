// Phase 50.3: Performance Trending
// Analyzes performance trends over time for predictive insights

class PerformanceTrending {
  constructor() {
    this.metrics = [];
    this.trends = {};
    this.predictions = [];
    this.windowSize = 30; // 30 data points for trend analysis
    this.alerts = [];
  }

  recordMetric(metric) {
    this.metrics.push({
      timestamp: new Date(),
      apiLatency: metric.apiLatency || 0,
      errorRate: metric.errorRate || 0,
      cpuUsage: metric.cpuUsage || 0,
      memoryUsage: metric.memoryUsage || 0,
      throughput: metric.throughput || 0
    });

    if (this.metrics.length > 500) {
      this.metrics.shift();
    }
  }

  calculateTrend(metricName) {
    if (this.metrics.length < this.windowSize) return null;

    const values = this.metrics.slice(-this.windowSize).map(m => m[metricName]);
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i + 1);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return {
      slope,
      intercept,
      direction: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable'
    };
  }

  predictNextValue(metricName) {
    const trend = this.calculateTrend(metricName);
    if (!trend) return null;

    const lastValue = this.metrics[this.metrics.length - 1][metricName];
    const predicted = trend.intercept + trend.slope * (this.metrics.length + 1);

    return {
      current: lastValue,
      predicted,
      trend: trend.direction,
      changePercent: ((predicted - lastValue) / lastValue) * 100
    };
  }

  detectTrendingIssues() {
    const issues = [];
    const metrics = ['apiLatency', 'errorRate', 'cpuUsage', 'memoryUsage'];

    metrics.forEach(metric => {
      const prediction = this.predictNextValue(metric);
      if (!prediction) return;

      const threshold = {
        apiLatency: 20, // 20% increase
        errorRate: 15,  // 15% increase
        cpuUsage: 25,   // 25% increase
        memoryUsage: 25 // 25% increase
      };

      if (prediction.trend === 'increasing' && prediction.changePercent > threshold[metric]) {
        issues.push({
          metric,
          severity: prediction.changePercent > 50 ? 'CRITICAL' : 'HIGH',
          predictedChange: prediction.changePercent.toFixed(2) + '%',
          estimated_time: '5-10 minutes'
        });
      }
    });

    if (issues.length > 0) {
      this.alerts.push({
        timestamp: new Date(),
        issues
      });
      console.warn('Trending issues detected', issues);
    }

    return issues;
  }

  getMetricsReport() {
    if (this.metrics.length === 0) return null;

    const report = {};
    const metricNames = ['apiLatency', 'errorRate', 'cpuUsage', 'memoryUsage', 'throughput'];

    metricNames.forEach(metric => {
      const values = this.metrics.map(m => m[metric]);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);

      report[metric] = {
        average: avg.toFixed(2),
        max,
        min,
        trend: this.calculateTrend(metric)
      };
    });

    return report;
  }

  clearAlerts() {
    this.alerts = [];
    console.log('Alerts cleared');
  }
}

window.performanceTrending = new PerformanceTrending();
console.log('PerformanceTrending loaded');
