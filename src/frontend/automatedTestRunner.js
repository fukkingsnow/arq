// Phase 50.1: Automated Test Runner
// Manages scheduled test execution, result tracking, and alert triggering

class AutomatedTestRunner {
  constructor() {
    this.testSchedules = [];
    this.testResults = [];
    this.alertConfig = {
      enabled: true,
      threshold: 3,
      successThreshold: 0.95
    };
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.setupPerformanceObserver();
    this.setupAPIInterceptors();
    this.initialized = true;
    console.log('Automated Test Runner initialized');
  }

  scheduleTests(interval = 300000) {
    const schedule = {
      id: `schedule_${Date.now()}`,
      interval: interval,
      nextRun: Date.now() + interval,
      enabled: true,
      testType: 'e2e'
    };
    this.testSchedules.push(schedule);
    this.startScheduler(schedule);
    console.log(`Test scheduled every ${interval}ms`);
    return schedule.id;
  }

  startScheduler(schedule) {
    const intervalId = setInterval(() => {
      if (!schedule.enabled) return;
      this.executeTestSuite(schedule.testType);
      schedule.nextRun = Date.now() + schedule.interval;
    }, schedule.interval);
    schedule.intervalId = intervalId;
  }

  async executeTestSuite(testType = 'e2e') {
    const startTime = performance.now();
    const result = {
      id: `result_${Date.now()}`,
      testType: testType,
      startTime: new Date(),
      duration: 0,
      passed: 0,
      failed: 0,
      errors: [],
      metrics: {}
    };

    try {
      if (window.e2eTester) {
        const testResults = await window.e2eTester.runAllTests();
        result.passed = testResults.filter(r => r.success).length;
        result.failed = testResults.filter(r => !r.success).length;
        result.errors = testResults.filter(r => !r.success).map(r => r.error);
      }

      if (window.performanceMonitor) {
        result.metrics = {
          apiLatency: window.performanceMonitor.getAverageLatency(),
          wsLatency: window.performanceMonitor.getWSLatency(),
          memory: window.performanceMonitor.getMemoryUsage(),
          errorRate: window.performanceMonitor.getErrorRate()
        };
      }

      result.duration = performance.now() - startTime;
      result.success = result.failed === 0;
      this.captureResults(result);
      this.checkThresholds(result);
    } catch (error) {
      result.error = error.message;
      result.success = false;
      this.captureResults(result);
    }
    return result;
  }

  captureResults(result) {
    this.testResults.push(result);
    if (this.testResults.length > 100) {
      this.testResults = this.testResults.slice(-100);
    }
    console.log(`Test: ${result.passed}/${result.passed + result.failed} (${result.duration.toFixed(0)}ms)`);
  }

  checkThresholds(result) {
    const successRate = result.passed / (result.passed + result.failed || 1);
    if (successRate < this.alertConfig.successThreshold) {
      this.triggerAlerts({
        type: 'test_failure',
        severity: 'high',
        message: `Success rate ${(successRate * 100).toFixed(1)}%`,
        result: result
      });
    }
    if (result.metrics) {
      if (result.metrics.apiLatency > 500) {
        this.triggerAlerts({
          type: 'latency_warning',
          severity: 'medium',
          message: `API latency ${result.metrics.apiLatency}ms`,
          metric: 'apiLatency'
        });
      }
      if (result.metrics.memory > 140) {
        this.triggerAlerts({
          type: 'memory_warning',
          severity: 'high',
          message: `Memory ${result.metrics.memory}MB critical`,
          metric: 'memory'
        });
      }
    }
  }

  triggerAlerts(alert) {
    if (!this.alertConfig.enabled) return;
    alert.timestamp = new Date();
    console.warn(`Alert [${alert.severity}]: ${alert.message}`);
    const alerts = JSON.parse(sessionStorage.getItem('testAlerts') || '[]');
    alerts.push(alert);
    if (alerts.length > 30) alerts.shift();
    sessionStorage.setItem('testAlerts', JSON.stringify(alerts));
    window.dispatchEvent(new CustomEvent('testAlert', { detail: alert }));
  }

  setupPerformanceObserver() {
    if (!window.PerformanceObserver) return;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 1000) {
          console.warn(`Slow: ${entry.name} (${entry.duration.toFixed(0)}ms)`);
        }
      }
    });
    observer.observe({ entryTypes: ['measure', 'navigation'] });
  }

  setupAPIInterceptors() {
    const originalFetch = window.fetch;
    const self = this;
    window.fetch = function(...args) {
      const startTime = performance.now();
      return originalFetch.apply(this, args)
        .then(response => {
          const duration = performance.now() - startTime;
          if (duration > 1000) {
            self.triggerAlerts({
              type: 'slow_request',
              severity: 'medium',
              message: `Slow: ${args[0]} (${duration.toFixed(0)}ms)`,
              duration: duration
            });
          }
          return response;
        })
        .catch(error => {
          self.triggerAlerts({
            type: 'api_error',
            severity: 'high',
            message: `Error: ${args[0]}`,
            error: error.message
          });
          throw error;
        });
    };
  }

  getResults(limit = 20) {
    return this.testResults.slice(-limit);
  }

  getStats() {
    if (this.testResults.length === 0) return null;
    const recent = this.testResults.slice(-20);
    const passCount = recent.filter(r => r.success).length;
    const failCount = recent.filter(r => !r.success).length;
    const avgDuration = recent.reduce((sum, r) => sum + r.duration, 0) / recent.length;
    return {
      totalTests: recent.length,
      passed: passCount,
      failed: failCount,
      successRate: (passCount / recent.length * 100).toFixed(1),
      avgDuration: avgDuration.toFixed(0),
      lastRun: recent[recent.length - 1]?.startTime
    };
  }

  clearResults() {
    this.testResults = [];
    console.log('Test results cleared');
  }

  disable() {
    this.testSchedules.forEach(schedule => {
      schedule.enabled = false;
      clearInterval(schedule.intervalId);
    });
    console.log('Test runner disabled');
  }

  enable() {
    this.testSchedules.forEach(schedule => {
      schedule.enabled = true;
      this.startScheduler(schedule);
    });
    console.log('Test runner enabled');
  }
}

window.automatedTestRunner = new AutomatedTestRunner();
window.automatedTestRunner.init();
console.log('AutomatedTestRunner loaded');
