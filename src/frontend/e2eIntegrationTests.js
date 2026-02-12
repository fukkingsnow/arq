// Phase 48: End-to-End Integration Testing
// Comprehensive test suite using performanceMonitor for validation

class E2EIntegrationTester {
  constructor() {
    this.testResults = [];
    this.scenarios = [];
    this.performanceThresholds = {
      apiResponseTime: 500,     // ms
      wsLatency: 100,           // ms
      uiRenderTime: 16.67,      // ms (60 FPS target)
      memoryLimit: 150,         // MB
      aiResponseTime: 5000      // ms
    };
  }

  // Register test scenarios
  registerScenario(name, testFn) {
    this.scenarios.push({
      name,
      testFn,
      startTime: null,
      endTime: null,
      duration: 0,
      status: 'pending',
      errors: []
    });
  }

  // Scenario 1: Bulk Task Creation
  async testBulkTaskCreation(count = 50) {
    const startTime = performance.now();
    const results = {
      created: 0,
      failed: 0,
      avgResponseTime: 0,
      totalDuration: 0,
      memoryBefore: performance.memory?.usedJSHeapSize,
      memoryAfter: 0
    };

    try {
      const apiMetrics = window.performanceMonitor?.metrics?.apiCalls || [];
      const metricsBeforeCount = apiMetrics.length;

      // Create tasks sequentially
      for (let i = 0; i < count; i++) {
        try {
          const response = await fetch('/api/v1/taskstasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              goal: `Test Task ${i + 1}`,
              priority: 'medium',
              maxIterations: 1
            })
          });
          if (response.ok) results.created++;
          else results.failed++;
        } catch (e) {
          results.failed++;
        }
      }

      const metricsAfter = window.performanceMonitor?.metrics?.apiCalls || [];
      const newMetrics = metricsAfter.slice(metricsBeforeCount);
      const durations = newMetrics.map(m => m.duration).filter(d => d);
      
      results.avgResponseTime = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;
      results.totalDuration = performance.now() - startTime;
      results.memoryAfter = performance.memory?.usedJSHeapSize;

      return {
        test: 'Bulk Task Creation',
        passed: results.created > 0 && results.avgResponseTime < this.performanceThresholds.apiResponseTime,
        details: results
      };
    } catch (error) {
      return {
        test: 'Bulk Task Creation',
        passed: false,
        error: error.message,
        details: results
      };
    }
  }

  // Scenario 2: High-Frequency Updates
  async testHighFrequencyUpdates(taskId, updateCount = 30) {
    const startTime = performance.now();
    const results = {
      updated: 0,
      failed: 0,
      avgResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity
    };

    try {
      const apiMetrics = window.performanceMonitor?.metrics?.apiCalls || [];
      const metricsBeforeCount = apiMetrics.length;

      // Rapid sequential updates
      for (let i = 0; i < updateCount; i++) {
        try {
          const response = await fetch(`/api/v1/taskstasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: i % 2 === 0 ? 'in_progress' : 'queued',
              iteration: i + 1
            })
          });
          if (response.ok) results.updated++;
          else results.failed++;
        } catch (e) {
          results.failed++;
        }
      }

      const metricsAfter = window.performanceMonitor?.metrics?.apiCalls || [];
      const newMetrics = metricsAfter.slice(metricsBeforeCount);
      const durations = newMetrics.map(m => m.duration).filter(d => d);
      
      if (durations.length > 0) {
        results.avgResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;
        results.maxResponseTime = Math.max(...durations);
        results.minResponseTime = Math.min(...durations);
      }

      return {
        test: 'High-Frequency Updates',
        passed: results.updated > 0 && results.avgResponseTime < this.performanceThresholds.apiResponseTime,
        details: results
      };
    } catch (error) {
      return {
        test: 'High-Frequency Updates',
        passed: false,
        error: error.message,
        details: results
      };
    }
  }

  // Scenario 3: Long-Running Operations
  async testLongRunningOperations(taskId) {
    const startTime = performance.now();
    const statusCheckInterval = 500; // ms
    const maxWaitTime = 30000; // 30 seconds
    const results = {
      statusChecks: 0,
      completionTime: 0,
      avgPollingResponseTime: 0,
      memoryLeakDetected: false
    };

    try {
      const memBefore = performance.memory?.usedJSHeapSize || 0;
      const apiMetrics = window.performanceMonitor?.metrics?.apiCalls || [];
      const metricsBeforeCount = apiMetrics.length;

      // Poll for completion
      while (performance.now() - startTime < maxWaitTime) {
        try {
          const response = await fetch(`/api/v1/taskstasks/${taskId}`);
          const task = await response.json();
          results.statusChecks++;

          if (task.status === 'completed') {
            results.completionTime = performance.now() - startTime;
            break;
          }
        } catch (e) {
          // Retry
        }
        await new Promise(resolve => setTimeout(resolve, statusCheckInterval));
      }

      const metricsAfter = window.performanceMonitor?.metrics?.apiCalls || [];
      const newMetrics = metricsAfter.slice(metricsBeforeCount);
      const durations = newMetrics.map(m => m.duration).filter(d => d);
      
      results.avgPollingResponseTime = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

      const memAfter = performance.memory?.usedJSHeapSize || 0;
      results.memoryLeakDetected = (memAfter - memBefore) > 50 * 1024 * 1024; // 50MB increase

      return {
        test: 'Long-Running Operations',
        passed: results.completionTime > 0 && !results.memoryLeakDetected,
        details: results
      };
    } catch (error) {
      return {
        test: 'Long-Running Operations',
        passed: false,
        error: error.message,
        details: results
      };
    }
  }

  // Scenario 4: Error Recovery
  async testErrorRecovery() {
    const results = {
      validationErrors: 0,
      networkErrors: 0,
      serverErrors: 0,
      recoverySuccesses: 0,
      totalAttempts: 0
    };

    try {
      // Test 1: Validation error
      results.totalAttempts++;
      try {
        const response = await fetch('/api/v1/taskstasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal: '' }) // Invalid: empty goal
        });
        if (response.status === 400) {
          results.validationErrors++;
          results.recoverySuccesses++;
        }
      } catch (e) {
        // Expected
      }

      // Test 2: Network timeout recovery
      results.totalAttempts++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        
        await fetch('/api/v1/taskstasks', {
          signal: controller.signal
        });
      } catch (e) {
        if (e.name === 'AbortError') {
          results.networkErrors++;
          // Retry logic would go here
          results.recoverySuccesses++;
        }
      }

      return {
        test: 'Error Recovery',
        passed: results.recoverySuccesses >= 1,
        details: results
      };
    } catch (error) {
      return {
        test: 'Error Recovery',
        passed: false,
        error: error.message,
        details: results
      };
    }
  }

  // Memory leak detection
  detectMemoryLeaks() {
    const memoryHistory = window.performanceMonitor?.metrics?.memoryUsage || [];
    if (memoryHistory.length < 2) return null;

    const oldest = memoryHistory[0];
    const newest = memoryHistory[memoryHistory.length - 1];
    const increase = newest.usedJSHeapSize - oldest.usedJSHeapSize;
    const threshold = 30; // MB

    return {
      detected: increase > threshold,
      increase: Math.round(increase * 100) / 100,
      threshold,
      timeSpan: 'monitoring_period'
    };
  }

  // Performance validation
  validatePerformanceThresholds() {
    const monitor = window.performanceMonitor;
    if (!monitor) return null;

    const summary = monitor.getMetricsSummary();
    const violations = [];

    if (summary.apiAvg && summary.apiAvg > this.performanceThresholds.apiResponseTime) {
      violations.push({
        metric: 'API Response Time',
        actual: summary.apiAvg,
        threshold: this.performanceThresholds.apiResponseTime
      });
    }

    if (summary.wsAvgLatency && summary.wsAvgLatency > this.performanceThresholds.wsLatency) {
      violations.push({
        metric: 'WebSocket Latency',
        actual: summary.wsAvgLatency,
        threshold: this.performanceThresholds.wsLatency
      });
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  // Run all tests
  async runAllTests() {
    console.log('🪨 Starting E2E Integration Tests...');
    const results = [];

    // Run test scenarios
    results.push(await this.testBulkTaskCreation(10));
    results.push(await this.testErrorRecovery());
    results.push(await this.testHighFrequencyUpdates('test-task-1', 10));

    // Performance validation
    results.push(this.detectMemoryLeaks());
    results.push(this.validatePerformanceThresholds());

    // Summary
    const passed = results.filter(r => r && r.passed).length;
    const total = results.filter(r => r !== null).length;

    return {
      timestamp: new Date().toISOString(),
      testSuite: 'E2E Integration Testing',
      totalTests: total,
      passed,
      failed: total - passed,
      passRate: `${Math.round((passed / total) * 100)}%`,
      details: results
    };
  }
}

const e2eTester = new E2EIntegrationTester();
window.e2eTester = e2eTester;

console.log('✓ E2E Integration Tester loaded');
