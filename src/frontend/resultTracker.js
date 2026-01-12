resultTracker.js  // Phase 50.1: Result Tracker
// Captures and aggregates test results with persistence

class ResultTracker {
  constructor() {
    this.results = [];
    this.sessionId = `session_${Date.now()}`;
    this.storageKey = 'arq_test_results';
    this.maxResults = 1000;
    this.loadFromStorage();
  }

  recordResult(testName, success, duration, metadata = {}) {
    const result = {
      id: `result_${Date.now()}_${Math.random()}`,
      sessionId: this.sessionId,
      testName: testName,
      success: success,
      duration: duration,
      timestamp: new Date().toISOString(),
      metadata: metadata
    };

    this.results.push(result);
    if (this.results.length > this.maxResults) {
      this.results.shift();
    }

    this.saveToStorage();
    return result.id;
  }

  recordBatchResults(testResults) {
    testResults.forEach(tr => {
      this.recordResult(tr.testName, tr.success, tr.duration, tr.metadata);
    });
  }

  getResults(filters = {}) {
    let filtered = this.results;

    if (filters.testName) {
      filtered = filtered.filter(r => r.testName === filters.testName);
    }
    if (filters.success !== undefined) {
      filtered = filtered.filter(r => r.success === filters.success);
    }
    if (filters.since) {
      const sinceTime = new Date(filters.since).getTime();
      filtered = filtered.filter(r => new Date(r.timestamp).getTime() >= sinceTime);
    }
    if (filters.limit) {
      filtered = filtered.slice(-filters.limit);
    }

    return filtered;
  }

  getSummary(testName = null) {
    const results = testName 
      ? this.results.filter(r => r.testName === testName)
      : this.results;

    if (results.length === 0) return null;

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    const durations = results.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    return {
      testName: testName || 'All Tests',
      totalTests: results.length,
      successful: successful,
      failed: failed,
      successRate: (successful / results.length * 100).toFixed(1),
      avgDuration: avgDuration.toFixed(0),
      maxDuration: maxDuration.toFixed(0),
      minDuration: minDuration.toFixed(0),
      firstRun: results[0].timestamp,
      lastRun: results[results.length - 1].timestamp
    };
  }

  getTrendData(testName, periodMinutes = 60) {
    const period = periodMinutes * 60 * 1000;
    const now = Date.now();
    const results = testName 
      ? this.results.filter(r => r.testName === testName)
      : this.results;

    const filtered = results.filter(r => 
      now - new Date(r.timestamp).getTime() <= period
    );

    const buckets = {};
    filtered.forEach(r => {
      const bucketTime = Math.floor(new Date(r.timestamp).getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000);
      const key = new Date(bucketTime).toISOString();
      if (!buckets[key]) {
        buckets[key] = { passed: 0, failed: 0 };
      }
      if (r.success) {
        buckets[key].passed++;
      } else {
        buckets[key].failed++;
      }
    });

    return Object.entries(buckets).map(([timestamp, counts]) => ({
      timestamp: timestamp,
      ...counts,
      successRate: (counts.passed / (counts.passed + counts.failed) * 100).toFixed(1)
    }));
  }

  getFailedTests(limit = 50) {
    return this.results
      .filter(r => !r.success)
      .slice(-limit)
      .map(r => ({
        testName: r.testName,
        timestamp: r.timestamp,
        metadata: r.metadata
      }));
  }

  analyzePerformance() {
    if (this.results.length === 0) return null;

    const durations = this.results.map(r => r.duration).sort((a, b) => a - b);
    const p50 = durations[Math.floor(durations.length * 0.5)];
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const p99 = durations[Math.floor(durations.length * 0.99)];

    return {
      p50: p50.toFixed(0),
      p95: p95.toFixed(0),
      p99: p99.toFixed(0),
      slowestTest: this.results.reduce((max, r) => r.duration > max.duration ? r : max),
      fastestTest: this.results.reduce((min, r) => r.duration < min.duration ? r : min)
    };
  }

  exportResults(format = 'json') {
    const data = {
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      totalResults: this.results.length,
      summary: this.getSummary(),
      results: this.results,
      performance: this.analyzePerformance()
    };

    if (format === 'csv') {
      const rows = this.results.map(r => 
        `${r.testName},${r.success},${r.duration},${r.timestamp}`
      );
      return 'testName,success,duration,timestamp\n' + rows.join('\n');
    }

    return data;
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        sessionId: this.sessionId,
        results: this.results.slice(-100)
      }));
    } catch (e) {
      console.warn('Failed to save results to storage:', e);
    }
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.sessionId = data.sessionId || this.sessionId;
        this.results = data.results || [];
      }
    } catch (e) {
      console.warn('Failed to load results from storage:', e);
    }
  }

  clearResults() {
    this.results = [];
    this.saveToStorage();
    console.log('Results cleared');
  }

  generateReport() {
    const summary = this.getSummary();
    const performance = this.analyzePerformance();
    const failed = this.getFailedTests(10);

    return {
      title: 'ARQ Test Results Report',
      timestamp: new Date().toISOString(),
      summary: summary,
      performance: performance,
      recentFailures: failed,
      totalResults: this.results.length
    };
  }
}

window.resultTracker = new ResultTracker();
console.log('ResultTracker loaded');
