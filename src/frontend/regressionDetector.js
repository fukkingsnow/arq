regressionDetector.js  // Phase 50.3: Regression Detector
// Detects performance regressions by comparing against baseline metrics

class RegressionDetector {
  constructor() {
    this.baseline = null;
    this.currentMetrics = null;
    this.regressions = [];
    this.threshold = 0.1; // 10% degradation threshold
    this.history = [];
  }

  captureBaseline(metrics) {
    this.baseline = {
      timestamp: new Date(),
      apiLatency: metrics.apiLatency || 0,
      wsLatency: metrics.wsLatency || 0,
      memory: metrics.memory || 0,
      errorRate: metrics.errorRate || 0,
      throughput: metrics.throughput || 0,
      successRate: metrics.successRate || 1
    };
    console.log('Baseline captured');
    return this.baseline;
  }

  compareMetrics(current) {
    if (!this.baseline) {
      console.warn('No baseline to compare against');
      return null;
    }

    this.currentMetrics = current;
    const comparison = {};

    // API Latency
    comparison.apiLatency = this.calculateChange(
      this.baseline.apiLatency,
      current.apiLatency
    );

    // WebSocket Latency
    comparison.wsLatency = this.calculateChange(
      this.baseline.wsLatency,
      current.wsLatency
    );

    // Memory Usage
    comparison.memory = this.calculateChange(
      this.baseline.memory,
      current.memory
    );

    // Error Rate (lower is better)
    comparison.errorRate = this.calculateChange(
      this.baseline.errorRate,
      current.errorRate,
      true
    );

    // Throughput (higher is better)
    comparison.throughput = this.calculateChange(
      this.baseline.throughput,
      current.throughput,
      false,
      true
    );

    // Success Rate (higher is better)
    comparison.successRate = this.calculateChange(
      this.baseline.successRate,
      current.successRate,
      false,
      true
    );

    this.detectRegressions(comparison);
    return comparison;
  }

  calculateChange(baseline, current, lowerIsBetter = false, higherIsBetter = false) {
    if (baseline === 0) return current > 0 ? Infinity : 0;

    const percentChange = ((current - baseline) / baseline * 100).toFixed(2);
    const isRegression = lowerIsBetter 
      ? percentChange > this.threshold * 100
      : higherIsBetter
        ? percentChange < -this.threshold * 100
        : percentChange > this.threshold * 100;

    return {
      baseline: baseline,
      current: current,
      change: parseFloat(percentChange),
      isRegression: isRegression
    };
  }

  detectRegressions(comparison) {
    const detected = [];

    for (const [metric, data] of Object.entries(comparison)) {
      if (data.isRegression) {
        detected.push({
          metric: metric,
          baseline: data.baseline,
          current: data.current,
          changePercent: data.change,
          severity: this.calculateSeverity(Math.abs(data.change)),
          timestamp: new Date()
        });
      }
    }

    if (detected.length > 0) {
      this.regressions.push(...detected);
      console.warn(`Detected ${detected.length} regressions`);
      detected.forEach(r => {
        console.warn(`${r.metric}: ${r.changePercent}% (${r.severity})`);
      });
    }

    return detected;
  }

  calculateSeverity(percentChange) {
    if (percentChange > 50) return 'CRITICAL';
    if (percentChange > 25) return 'HIGH';
    if (percentChange > 10) return 'MEDIUM';
    return 'LOW';
  }

  getRegressions(limit = 50) {
    return this.regressions.slice(-limit);
  }

  getRegressionStats() {
    if (this.regressions.length === 0) return null;

    const byMetric = {};
    const bySeverity = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };

    this.regressions.forEach(r => {
      if (!byMetric[r.metric]) {
        byMetric[r.metric] = 0;
      }
      byMetric[r.metric]++;
      bySeverity[r.severity]++;
    });

    return {
      totalRegressions: this.regressions.length,
      byMetric: byMetric,
      bySeverity: bySeverity
    };
  }

  clearRegressions() {
    this.regressions = [];
    console.log('Regressions cleared');
  }
}

window.regressionDetector = new RegressionDetector();
console.log('RegressionDetector loaded');
