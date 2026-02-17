import { Test, TestingModule } from '@nestjs/testing';
import { RedisQueueService } from '../../queue/redis-queue.service';

interface PerformanceMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalDuration: number;
  throughput: number; // tasks per second
  avgTaskTime: number;
  minTaskTime: number;
  maxTaskTime: number;
}

describe('Queue Throughput Performance Tests', () => {
  let service: RedisQueueService;
  let metrics: PerformanceMetrics;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [RedisQueueService],
    }).compile();

    service = moduleFixture.get<RedisQueueService>(RedisQueueService);
    metrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      totalDuration: 0,
      throughput: 0,
      avgTaskTime: 0,
      minTaskTime: Infinity,
      maxTaskTime: 0,
    };
  });

  describe('Queue Throughput Benchmark', () => {
    it('should process 1000 tasks within 30 seconds', async () => {
      const taskCount = 1000;
      const startTime = Date.now();
      const taskTimes: number[] = [];

      for (let i = 0; i < taskCount; i++) {
        const taskStartTime = Date.now();
        const task = {
          id: `perf-task-${i}`,
          type: 'process',
          priority: 'medium',
          data: { index: i },
        };

        try {
          await service.enqueueTask(task);
          const taskDuration = Date.now() - taskStartTime;
          taskTimes.push(taskDuration);
          metrics.completedTasks++;
        } catch (error) {
          metrics.failedTasks++;
        }
        metrics.totalTasks++;
      }

      const totalDuration = Date.now() - startTime;
      metrics.totalDuration = totalDuration;
      metrics.avgTaskTime =
        taskTimes.reduce((a, b) => a + b, 0) / taskTimes.length;
      metrics.minTaskTime = Math.min(...taskTimes);
      metrics.maxTaskTime = Math.max(...taskTimes);
      metrics.throughput = (taskCount / totalDuration) * 1000; // tasks per second

      console.log('\n=== Queue Throughput Metrics ===');
      console.log(`Total Tasks: ${metrics.totalTasks}`);
      console.log(`Completed: ${metrics.completedTasks}`);
      console.log(`Failed: ${metrics.failedTasks}`);
      console.log(`Total Duration: ${metrics.totalDuration}ms`);
      console.log(`Throughput: ${metrics.throughput.toFixed(2)} tasks/sec`);
      console.log(`Avg Task Time: ${metrics.avgTaskTime.toFixed(2)}ms`);
      console.log(`Min Task Time: ${metrics.minTaskTime.toFixed(2)}ms`);
      console.log(`Max Task Time: ${metrics.maxTaskTime.toFixed(2)}ms`);

      expect(totalDuration).toBeLessThan(30000); // 30 seconds
      expect(metrics.completedTasks).toBeGreaterThanOrEqual(900); // 90% success rate
    });

    it('should maintain consistent latency under load', async () => {
      const taskCount = 500;
      const taskTimes: number[] = [];

      for (let i = 0; i < taskCount; i++) {
        const taskStartTime = Date.now();
        const task = {
          id: `consistency-task-${i}`,
          type: 'process',
          data: {},
        };

        try {
          await service.enqueueTask(task);
          const taskDuration = Date.now() - taskStartTime;
          taskTimes.push(taskDuration);
        } catch (error) {
          console.error(`Task ${i} failed:`, error);
        }
      }

      const avgTime =
        taskTimes.reduce((a, b) => a + b, 0) / taskTimes.length;
      const variance =
        taskTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) /
        taskTimes.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = (stdDev / avgTime) * 100;

      console.log('\n=== Latency Consistency Metrics ===');
      console.log(`Average Latency: ${avgTime.toFixed(2)}ms`);
      console.log(`Std Deviation: ${stdDev.toFixed(2)}ms`);
      console.log(`Coefficient of Variation: ${coefficientOfVariation.toFixed(2)}%`);

      expect(coefficientOfVariation).toBeLessThan(50); // CV < 50%
    });

    it('should handle burst load gracefully', async () => {
      const burstSize = 100;
      const burstCount = 5;
      const startTime = Date.now();
      let successCount = 0;

      for (let burst = 0; burst < burstCount; burst++) {
        const burstPromises = [];

        for (let i = 0; i < burstSize; i++) {
          const taskId = `burst-${burst}-${i}`;
          const task = {
            id: taskId,
            type: 'process',
            priority: 'high',
            data: { burst },
          };

          burstPromises.push(
            service.enqueueTask(task).then(() => {
              successCount++;
            })
          );
        }

        await Promise.all(burstPromises);
        // Small delay between bursts
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const totalDuration = Date.now() - startTime;
      const successRate = (successCount / (burstSize * burstCount)) * 100;

      console.log('\n=== Burst Load Metrics ===');
      console.log(`Total Tasks: ${burstSize * burstCount}`);
      console.log(`Successful: ${successCount}`);
      console.log(`Success Rate: ${successRate.toFixed(2)}%`);
      console.log(`Total Duration: ${totalDuration}ms`);

      expect(successRate).toBeGreaterThanOrEqual(95); // 95% success rate
    });

    it('should dequeue tasks efficiently', async () => {
      const dequeueTimes: number[] = [];
      const dequeueCount = 100;

      for (let i = 0; i < dequeueCount; i++) {
        const startTime = Date.now();
        const task = await service.dequeueTask();
        const duration = Date.now() - startTime;
        dequeueTimes.push(duration);
      }

      const avgDequeueTime =
        dequeueTimes.reduce((a, b) => a + b, 0) / dequeueTimes.length;
      const maxDequeueTime = Math.max(...dequeueTimes);

      console.log('\n=== Dequeue Performance Metrics ===');
      console.log(`Avg Dequeue Time: ${avgDequeueTime.toFixed(2)}ms`);
      console.log(`Max Dequeue Time: ${maxDequeueTime.toFixed(2)}ms`);
      console.log(`Total Dequeues: ${dequeueCount}`);

      expect(avgDequeueTime).toBeLessThan(50); // < 50ms average
      expect(maxDequeueTime).toBeLessThan(200); // < 200ms max
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during high volume operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const taskCount = 500;

      for (let i = 0; i < taskCount; i++) {
        const task = {
          id: `memory-test-${i}`,
          type: 'process',
          data: { payload: 'x'.repeat(100) },
        };
        await service.enqueueTask(task);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreasePerTask = memoryIncrease / taskCount;

      console.log('\n=== Memory Usage Metrics ===');
      console.log(`Initial Memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Final Memory: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(
        `Memory Increase per Task: ${(memoryIncreasePerTask / 1024).toFixed(2)}KB`
      );

      expect(memoryIncreasePerTask).toBeLessThan(10 * 1024); // < 10KB per task
    });
  });
});
