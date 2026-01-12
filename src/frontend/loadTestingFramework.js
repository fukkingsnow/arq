loadTestingFramework.js  // Phase 50.2: Load Testing Framework
// 4 load testing scenarios: smoke, load, stress, soak

class LoadTestingFramework {
  constructor() {
    this.scenarios = {
      smoke: { users: 5, duration: 300000, name: 'Smoke Test (5 users, 5 min)' },
      load: { users: 50, duration: 900000, name: 'Load Test (50 users, 15 min)' },
      stress: { users: 200, duration: 1200000, name: 'Stress Test (200 users, 20 min)' },
      soak: { users: 100, duration: 3600000, name: 'Soak Test (100 users, 60 min)' }
    };
    this.activeTests = new Map();
    this.testResults = [];
  }

  async runSmoke() {
    return this.runLoadTest('smoke');
  }

  async runLoad() {
    return this.runLoadTest('load');
  }

  async runStress() {
    return this.runLoadTest('stress');
  }

  async runSoak() {
    return this.runLoadTest('soak');
  }

  async runLoadTest(scenarioName) {
    const scenario = this.scenarios[scenarioName];
    if (!scenario) {
      console.error(`Unknown scenario: ${scenarioName}`);
      return null;
    }

    const testId = `test_${Date.now()}`;
    const result = {
      id: testId,
      scenario: scenarioName,
      scenarioName: scenario.name,
      startTime: new Date(),
      users: scenario.users,
      duration: scenario.duration,
      successCount: 0,
      failureCount: 0,
      metrics: {
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
        errorRate: 0
      },
      virtualUsers: []
    };

    this.activeTests.set(testId, result);
    console.log(`Starting ${scenario.name}...`);

    try {
      await this.simulateLoad(result);
      result.endTime = new Date();
      result.totalDuration = result.endTime - result.startTime;
      this.calculateMetrics(result);
      console.log(`${scenario.name} completed: ${result.successCount} passed, ${result.failureCount} failed`);
    } catch (error) {
      console.error(`Test failed:`, error);
      result.error = error.message;
    }

    this.testResults.push(result);
    this.activeTests.delete(testId);
    return result;
  }

  async simulateLoad(testResult) {
    const { users, duration } = this.scenarios[testResult.scenario];
    const startTime = Date.now();
    const responseTimes = [];

    // Create virtual users
    for (let i = 0; i < users; i++) {
      testResult.virtualUsers.push({
        id: i,
        requests: 0,
        errors: 0,
        totalResponseTime: 0
      });
    }

    // Ramp-up: gradually increase users
    const rampUpDuration = Math.min(60000, duration / 4);
    const rampUpInterval = rampUpDuration / users;
    let activeUsersCount = 0;

    const rampUp = new Promise(resolve => {
      let rampIndex = 0;
      const rampUpTimer = setInterval(() => {
        if (rampIndex < users) {
          activeUsersCount++;
          rampIndex++;
        } else {
          clearInterval(rampUpTimer);
          resolve();
        }
      }, rampUpInterval);
    });

    await rampUp;

    // Steady state: maintain load
    return new Promise((resolve) => {
      const steadyStateStart = Date.now();
      const steadyStateTimer = setInterval(async () => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= duration) {
          clearInterval(steadyStateTimer);
          resolve();
          return;
        }

        // Each active user makes requests
        for (let i = 0; i < activeUsersCount; i++) {
          const user = testResult.virtualUsers[i];
          try {
            const reqStart = performance.now();
            
            // Simulate API call
            await this.makeApiCall();
            
            const responseTime = performance.now() - reqStart;
            responseTimes.push(responseTime);
            user.requests++;
            user.totalResponseTime += responseTime;
            testResult.successCount++;

            // Check thresholds
            if (responseTime > 500) {
              console.warn(`Slow response: ${responseTime.toFixed(0)}ms`);
            }
          } catch (error) {
            user.errors++;
            testResult.failureCount++;
          }
        }
      }, 100);
    });
  }

  async makeApiCall() {
    // Simulate API call with random delay
    const delay = Math.random() * 200 + 50; // 50-250ms
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.02) { // 98% success rate
          resolve();
        } else {
          reject(new Error('API Error'));
        }
      }, delay);
    });
  }

  calculateMetrics(testResult) {
    const responseTimes = testResult.virtualUsers.reduce((acc, user) => {
      if (user.requests > 0) {
        acc.push(user.totalResponseTime / user.requests);
      }
      return acc;
    }, []).sort((a, b) => a - b);

    if (responseTimes.length > 0) {
      testResult.metrics.minResponseTime = Math.min(...responseTimes);
      testResult.metrics.maxResponseTime = Math.max(...responseTimes);
      testResult.metrics.avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
      testResult.metrics.p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)];
      testResult.metrics.p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)];
    }

    const totalRequests = testResult.successCount + testResult.failureCount;
    testResult.metrics.throughput = totalRequests / (testResult.totalDuration / 1000);
    testResult.metrics.errorRate = testResult.failureCount / totalRequests;
  }

  getTestStatus(testId) {
    const test = this.activeTests.get(testId) || this.testResults.find(t => t.id === testId);
    if (!test) return null;

    const isActive = this.activeTests.has(testId);
    const elapsed = isActive ? Date.now() - test.startTime.getTime() : test.totalDuration;
    const progress = (elapsed / test.duration * 100).toFixed(1);

    return {
      id: testId,
      scenario: test.scenario,
      isActive: isActive,
      progress: progress,
      successCount: test.successCount,
      failureCount: test.failureCount,
      successRate: ((test.successCount / (test.successCount + test.failureCount)) * 100).toFixed(1),
      metrics: test.metrics
    };
  }

  getAllTestResults(limit = 20) {
    return this.testResults.slice(-limit).map(t => ({
      id: t.id,
      scenario: t.scenario,
      scenarioName: t.scenarioName,
      startTime: t.startTime,
      endTime: t.endTime,
      totalDuration: t.totalDuration,
      successCount: t.successCount,
      failureCount: t.failureCount,
      metrics: t.metrics,
      error: t.error || null
    }));
  }

  generateReport(testId) {
    const test = this.testResults.find(t => t.id === testId);
    if (!test) return null;

    const userStats = test.virtualUsers.map(u => ({
      userId: u.id,
      requests: u.requests,
      errors: u.errors,
      avgResponseTime: u.requests > 0 ? (u.totalResponseTime / u.requests).toFixed(0) : 'N/A'
    }));

    return {
      title: `Load Test Report: ${test.scenarioName}`,
      timestamp: test.startTime,
      duration: test.totalDuration,
      scenario: test.scenario,
      users: test.users,
      successCount: test.successCount,
      failureCount: test.failureCount,
      successRate: ((test.successCount / (test.successCount + test.failureCount)) * 100).toFixed(1),
      metrics: test.metrics,
      userStats: userStats,
      recommendations: this.generateRecommendations(test)
    };
  }

  generateRecommendations(test) {
    const recommendations = [];
    const errorRate = test.failureCount / (test.successCount + test.failureCount);
    const avgLatency = test.metrics.avgResponseTime;

    if (errorRate > 0.05) {
      recommendations.push('Critical: Error rate > 5%. Investigate system stability.');
    }
    if (avgLatency > 500) {
      recommendations.push('Warning: Average latency > 500ms. Consider optimization.');
    }
    if (test.metrics.p99ResponseTime > 1000) {
      recommendations.push('Warning: p99 latency > 1s. Check for bottlenecks.');
    }
    if (recommendations.length === 0) {
      recommendations.push('OK: System performed within acceptable parameters.');
    }

    return recommendations;
  }

  compareScenarios(scenario1Id, scenario2Id) {
    const test1 = this.testResults.find(t => t.id === scenario1Id);
    const test2 = this.testResults.find(t => t.id === scenario2Id);

    if (!test1 || !test2) return null;

    return {
      test1: {
        scenario: test1.scenario,
        successRate: (test1.successCount / (test1.successCount + test1.failureCount) * 100).toFixed(1),
        avgLatency: test1.metrics.avgResponseTime.toFixed(0),
        throughput: test1.metrics.throughput.toFixed(2)
      },
      test2: {
        scenario: test2.scenario,
        successRate: (test2.successCount / (test2.successCount + test2.failureCount) * 100).toFixed(1),
        avgLatency: test2.metrics.avgResponseTime.toFixed(0),
        throughput: test2.metrics.throughput.toFixed(2)
      }
    };
  }

  clearResults() {
    this.testResults = [];
    console.log('Test results cleared');
  }
}

window.loadTestingFramework = new LoadTestingFramework();
console.log('LoadTestingFramework loaded');
