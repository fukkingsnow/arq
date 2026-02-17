import { Injectable, Logger } from '@nestjs/common';

interface MetricValue {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  value: number;
  labels?: Record<string, string>;
}

interface HistogramBucket {
  le: number; // less than or equal
  count: number;
}

@Injectable()
export class PrometheusMetricsService {
  private readonly logger = new Logger(PrometheusMetricsService.name);
  private metrics: Map<string, MetricValue> = new Map();
  private histograms: Map<string, Map<number, HistogramBucket>> = new Map();
  private startTime = Date.now();

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, help: string, labels?: Record<string, string>): void {
    const key = `${name}:${JSON.stringify(labels || {})}`;
    let metric = this.metrics.get(key);

    if (!metric) {
      metric = {
        name,
        help,
        type: 'counter',
        value: 0,
        labels,
      };
    }

    metric.value++;
    this.metrics.set(key, metric);
  }

  /**
   * Set a gauge metric value
   */
  setGauge(name: string, help: string, value: number, labels?: Record<string, string>): void {
    const key = `${name}:${JSON.stringify(labels || {})}`;
    this.metrics.set(key, {
      name,
      help,
      type: 'gauge',
      value,
      labels,
    });
  }

  /**
   * Add histogram observation
   */
  observeHistogram(
    name: string,
    help: string,
    value: number,
    buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10],
    labels?: Record<string, string>
  ): void {
    const key = `${name}:${JSON.stringify(labels || {})}`;
    let histogram = this.histograms.get(key);

    if (!histogram) {
      histogram = new Map();
      buckets.forEach(bucket => {
        histogram!.set(bucket, { le: bucket, count: 0 });
      });
      histogram.set(Infinity, { le: Infinity, count: 0 });
      this.histograms.set(key, histogram);
    }

    // Increment buckets
    histogram.forEach((bucket) => {
      if (value <= bucket.le) {
        bucket.count++;
      }
    });

    // Also register as metric
    const metricKey = `${name}_sum:${JSON.stringify(labels || {})}`;
    let metric = this.metrics.get(metricKey);
    if (!metric) {
      metric = {
        name: `${name}_sum`,
        help: `${help} sum`,
        type: 'histogram',
        value: 0,
        labels,
      };
    }
    metric.value += value;
    this.metrics.set(metricKey, metric);
  }

  /**
   * Record request metrics
   */
  recordRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number
  ): void {
    // Request counter
    this.incrementCounter(
      'arq_http_requests_total',
      'Total HTTP requests',
      { method, path, status: statusCode.toString() }
    );

    // Request duration histogram
    this.observeHistogram(
      'arq_http_request_duration_seconds',
      'HTTP request duration in seconds',
      duration / 1000,
      undefined,
      { method, path }
    );
  }

  /**
   * Record task metrics
   */
  recordTaskProcessed(
    taskId: string,
    taskType: string,
    status: 'success' | 'failure',
    duration: number
  ): void {
    // Task counter
    this.incrementCounter(
      'arq_tasks_processed_total',
      'Total tasks processed',
      { type: taskType, status }
    );

    // Task duration
    this.observeHistogram(
      'arq_task_duration_seconds',
      'Task processing duration in seconds',
      duration / 1000,
      undefined,
      { type: taskType }
    );
  }

  /**
   * Record queue metrics
   */
  recordQueueMetrics(queueLength: number, consumerCount: number): void {
    this.setGauge(
      'arq_queue_length',
      'Current queue length',
      queueLength
    );

    this.setGauge(
      'arq_active_consumers',
      'Number of active consumers',
      consumerCount
    );
  }

  /**
   * Record circuit breaker state
   */
  recordCircuitBreakerState(serviceName: string, state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'): void {
    const stateValue = state === 'CLOSED' ? 0 : state === 'HALF_OPEN' ? 1 : 2;
    this.setGauge(
      'arq_circuit_breaker_state',
      'Circuit breaker state',
      stateValue,
      { service: serviceName }
    );
  }

  /**
   * Get metrics in Prometheus format
   */
  getMetricsAsPrometheus(): string {
    let output = '';

    // Add system metrics
    const uptime = (Date.now() - this.startTime) / 1000;
    output += `# HELP arq_uptime_seconds Application uptime in seconds\n`;
    output += `# TYPE arq_uptime_seconds gauge\n`;
    output += `arq_uptime_seconds ${uptime}\n\n`;

    // Group metrics by name
    const metricsByName = new Map<string, MetricValue[]>();
    this.metrics.forEach(metric => {
      if (!metricsByName.has(metric.name)) {
        metricsByName.set(metric.name, []);
      }
      metricsByName.get(metric.name)!.push(metric);
    });

    // Output metrics
    metricsByName.forEach((metrics, name) => {
      const firstMetric = metrics[0];
      output += `# HELP ${name} ${firstMetric.help}\n`;
      output += `# TYPE ${name} ${firstMetric.type}\n`;

      metrics.forEach(metric => {
        const labels = this.formatLabels(metric.labels);
        output += `${metric.name}${labels} ${metric.value}\n`;
      });
      output += '\n';
    });

    // Output histograms
    this.histograms.forEach((buckets, key) => {
      output += `# HELP arq_histogram_buckets Histogram buckets\n`;
      output += `# TYPE arq_histogram_buckets histogram\n`;
      buckets.forEach((bucket) => {
        output += `${key}{le="${bucket.le}"} ${bucket.count}\n`;
      });
      output += '\n';
    });

    return output;
  }

  /**
   * Get metrics as JSON
   */
  getMetricsAsJSON(): object {
    return {
      uptime_seconds: (Date.now() - this.startTime) / 1000,
      metrics: Array.from(this.metrics.values()),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([key, buckets]) => [
          key,
          Array.from(buckets.values()),
        ])
      ),
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.histograms.clear();
    this.startTime = Date.now();
    this.logger.log('All metrics have been reset');
  }

  /**
   * Format labels for Prometheus output
   */
  private formatLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }

    const labelPairs = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');

    return `{${labelPairs}}`;
  }
}
