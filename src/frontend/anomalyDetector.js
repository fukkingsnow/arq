// Phase 50.3: Anomaly Detector
// Detects performance anomalies using statistical methods

class AnomalyDetector {
  constructor() {
    this.baseline = null;
    this.stdDev = {};
    this.anomalies = [];
    this.threshold = 2.5; // 2.5 sigma
    this.history = [];
  }

  captureBaseline(metrics) {
    this.baseline = {
      timestamp: new Date(),
      apiLatency: metrics.apiLatency || 0,
      wsLatency: metrics.wsLatency || 0,
      errorRate: metrics.errorRate || 0,
      cpuUsage: metrics.cpuUsage || 0,
      memoryUsage: metrics.memoryUsage || 0
    };
    console.log('Anomaly baseline captured');
    return this.baseline;
  }

  calculateStatistics(metric) {
    if (this.history.length < 10) return null;

    const values = this.history.map(h => h[metric]);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev };
  }

  detectAnomalies(current) {
    const detected = [];

    this.history.push({
      timestamp: new Date(),
      apiLatency: current.apiLatency,
      wsLatency: current.wsLatency,
      errorRate: current.errorRate,
      cpuUsage: current.cpuUsage,
      memoryUsage: current.memoryUsage
    });

    if (this.history.length > 100) this.history.shift();

    const metrics = ['apiLatency', 'wsLatency', 'errorRate', 'cpuUsage', 'memoryUsage'];

    metrics.forEach(metric => {
      const stats = this.calculateStatistics(metric);
      if (!stats) return;

      const zScore = Math.abs((current[metric] - stats.mean) / stats.stdDev);

      if (zScore > this.threshold) {
        detected.push({
          metric,
          value: current[metric],
          mean: stats.mean,
          zscore: zScore,
          severity: zScore > 4 ? 'CRITICAL' : 'HIGH'
        });
      }
    });

    if (detected.length > 0) {
      this.anomalies.push({
        timestamp: new Date(),
        anomalies: detected
      });
      console.warn('Anomalies detected', detected);
    }

    return detected;
  }

  getAnomalyStats() {
    if (this.anomalies.length === 0) return null;

    return {
      totalAnomalies: this.anomalies.length,
      latestAnomalies: this.anomalies.slice(-10),
      criticalCount: this.anomalies.filter(a => a.anomalies.some(an => an.severity === 'CRITICAL')).length,
      highCount: this.anomalies.filter(a => a.anomalies.some(an => an.severity === 'HIGH')).length
    };
  }

  clearAnomalies() {
    this.anomalies = [];
    console.log('Anomalies cleared');
  }
}

window.anomalyDetector = new AnomalyDetector();
console.log('AnomalyDetector loaded');
