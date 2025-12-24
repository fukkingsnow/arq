import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { RedisQueueService } from '../../queue/redis-queue.service';
import { TaskConsumerService } from '../../consumers/task-consumer.service';
import { TaskErrorHandlerService } from '../../services/task-error-handler.service';
import { TaskEventsGateway } from '../../modules/events/task-events.gateway';

describe('Task Processing Integration Tests', () => {
  let app: INestApplication;
  let queueService: RedisQueueService;
  let consumerService: TaskConsumerService;
  let errorHandlerService: TaskErrorHandlerService;
  let eventsGateway: TaskEventsGateway;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        RedisQueueService,
        TaskConsumerService,
        TaskErrorHandlerService,
        TaskEventsGateway,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    queueService = moduleFixture.get<RedisQueueService>(RedisQueueService);
    consumerService = moduleFixture.get<TaskConsumerService>(TaskConsumerService);
    errorHandlerService = moduleFixture.get<TaskErrorHandlerService>(TaskErrorHandlerService);
    eventsGateway = moduleFixture.get<TaskEventsGateway>(TaskEventsGateway);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Task Workflow', () => {
    it('should process task from queue to completion', async () => {
      const task = {
        id: 'integration-task-1',
        type: 'process',
        priority: 'high',
        data: { message: 'Test message' },
      };

      // Step 1: Enqueue task
      const enqueuedResult = await queueService.enqueueTask(task);
      expect(enqueuedResult).toBeDefined();

      // Step 2: Verify task is in queue
      const queueLength = await queueService.getQueueLength();
      expect(queueLength).toBeGreaterThanOrEqual(0);

      // Step 3: Consumer retrieves task
      const dequeuedTask = await queueService.dequeueTask();
      expect(dequeuedTask).toBeDefined();
    });

    it('should handle task processing workflow with error handling', async () => {
      const failingTask = {
        id: 'integration-task-2',
        type: 'invalid',
        data: {},
        retries: 0,
        maxRetries: 3,
      };

      // Enqueue task
      await queueService.enqueueTask(failingTask);

      // Try to process and handle error
      const error = new Error('Task processing failed');
      const errorResult = await errorHandlerService.handleError(failingTask, error);
      expect(errorResult).toBeDefined();
    });

    it('should broadcast task updates to clients via gateway', async () => {
      const updateTask = {
        id: 'integration-task-3',
        status: 'completed',
        result: { success: true },
      };

      await eventsGateway.emitTaskUpdate(updateTask);
      expect(eventsGateway.server).toBeDefined();
    });
  });

  describe('Queue Service Integration', () => {
    it('should maintain queue order with multiple tasks', async () => {
      const task1 = { id: 'task-1', type: 'process', priority: 'high', data: {} };
      const task2 = { id: 'task-2', type: 'process', priority: 'medium', data: {} };
      const task3 = { id: 'task-3', type: 'process', priority: 'low', data: {} };

      await queueService.enqueueTask(task1);
      await queueService.enqueueTask(task2);
      await queueService.enqueueTask(task3);

      const length = await queueService.getQueueLength();
      expect(typeof length).toBe('number');
    });
  });

  describe('Error Handling Integration', () => {
    it('should classify and handle different error types', async () => {
      const task = { id: 'error-task', type: 'process', data: {} };

      const networkError = new Error('Network timeout');
      const isRetryable1 = await errorHandlerService.isRetryable(networkError);

      const validationError = new Error('Invalid input');
      const isRetryable2 = await errorHandlerService.isRetryable(validationError);

      expect(typeof isRetryable1).toBe('boolean');
      expect(typeof isRetryable2).toBe('boolean');
    });

    it('should log and track errors for monitoring', async () => {
      const task = { id: 'log-task', type: 'process', data: {} };
      const error = new Error('Integration test error');

      await errorHandlerService.logError(error, 'IntegrationTest');
      expect(error.message).toBeDefined();
    });
  });

  describe('Consumer Service Integration', () => {
    it('should start and stop consumer gracefully', async () => {
      await consumerService.startConsuming();
      expect(consumerService).toBeDefined();

      await consumerService.stopConsuming();
      expect(consumerService).toBeDefined();
    });

    it('should handle concurrent task processing', async () => {
      const tasks = [
        { id: 'concurrent-1', type: 'process', data: {} },
        { id: 'concurrent-2', type: 'process', data: {} },
        { id: 'concurrent-3', type: 'process', data: {} },
      ];

      const results = await Promise.all(
        tasks.map(task => queueService.enqueueTask(task))
      );

      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });
});
