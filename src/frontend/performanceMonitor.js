// Phase 47: Performance Monitoring Module
// Tracks API response times, UI render times, WebSocket latency, and memory usage

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      apiCalls: [],
      wsLatency: [],
      renderTimes: [],
      memoryUsage: [],
      taskOperations: [],
      aiResponses: []
    };
    this.maxHistorySize = 100;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.setupPerformanceObserver();
    this.setupApiInterception();
    this.setupMemoryTracking();
    this.setupWSTracking();
    this.initialized = true;
    console.log('✓ Performance Monitor initialized');
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('api')) {
            this.recordMetric('apiCalls', {
              url: entry.name,
              duration: Math.round(entry.duration),
              timestamp: new Date(entry.startTime).toISOString()
            });
          }
        }
      });
      observer.observe({ entryTypes: ['resource', 'measure'] });
    }
  }

  setupApiInterception() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        this.recordMetric('apiCalls', {
          method: args[1]?.method || 'GET',
          url: args[0],
          status: response.status,
          duration: Math.round(duration),
          timestamp: new Date().toISOString()
        });
        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.recordMetric('apiCalls', {
          url: args[0],
          error: error.message,
          duration: Math.round(duration),
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    };
  }

  setupMemoryTracking() {
    if (performance.memory) {
      setInterval(() => {
        this.recordMetric('memoryUsage', {
          usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576 * 100) / 100,
          totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576 * 100) / 100,
          jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1048576 * 100) / 100,
          timestamp: new Date().toISOString()
        });
      }, 5000);
    }
  }

  setupWSTracking() {
    // This will be called from taskWebSocket.ts
    window.addEventListener('taskWSLatency', (e) => {
      this.recordMetric('wsLatency', {
        latency: e.detail.latency,
        type: e.detail.type,
        timestamp: new Date().toISOString()
      });
    });
  }

  recordTaskOperation(operation) {
    this.recordMetric('taskOperations', {
      operation,
      timestamp: new Date().toISOString()
    });
  }

  recordAIResponse(duration, tokensUsed) {
    this.recordMetric('aiResponses', {
      duration: Math.round(duration),
      tokensUsed,
      timestamp: new Date().toISOString()
    });
  }

  recordRenderTime(componentName, duration) {
    this.recordMetric('renderTimes', {
      component: componentName,
      duration: Math.round(duration),
      timestamp: new Date().toISOString()
    });
  }

  recordMetric(category, data) {
    if (!this.metrics[category]) return;
    this.metrics[category].push(data);
    if (this.metrics[category].length > this.maxHistorySize) {
      this.metrics[category].shift();
    }
  }

  getMetricsSummary() {
    const summary = {};
    
    // API metrics
    if (this.metrics.apiCalls.length > 0) {
      const durations = this.metrics.apiCalls.map(m => m.duration).filter(d => d);
      summary.apiAvg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      summary.apiMin = Math.min(...durations);
      summary.apiMax = Math.max(...durations);
      summary.apiCount = this.metrics.apiCalls.length;
    }

    // Memory metrics
    if (this.metrics.memoryUsage.length > 0) {
      const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
      summary.memoryUsed = latest.usedJSHeapSize;
      summary.memoryTotal = latest.totalJSHeapSize;
    }

    // WS latency
    if (this.metrics.wsLatency.length > 0) {
      const latencies = this.metrics.wsLatency.map(m => m.latency);
      summary.wsAvgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
      summary.wsMaxLatency = Math.max(...latencies);
    }

    // Task operations
    summary.totalTaskOps = this.metrics.taskOperations.length;
    
    // AI responses
    if (this.metrics.aiResponses.length > 0) {
      const durations = this.metrics.aiResponses.map(m => m.duration);
      summary.aiAvgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    }

    return summary;
  }

  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      summary: this.getMetricsSummary(),
      detailed: this.metrics
    };
  }

  logSummary() {
    const summary = this.getMetricsSummary();
    console.log('📊 ARQ Performance Summary:', summary);
  }
}

const performanceMonitor = new PerformanceMonitor();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => performanceMonitor.init());
} else {
  performanceMonitor.init();
}

window.performanceMonitor = performanceMonitor;
