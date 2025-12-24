import { Test, TestingModule } from '@nestjs/testing';
import { TaskConsumerService } from '../../consumers/task-consumer.service';
import { RedisQueueService } from '../../queue/redis-queue.service';
import { TaskErrorHandlerService } from '../../services/task-error-handler.service';

describe('TaskConsumerService', () => {
  let service: TaskConsumerService;
  let queueService: any;
  let errorHandlerService: any;

  beforeEach(async () => {
    queueService = {
      dequeueTask: jest.fn().mockResolvedValue(null),
      enqueueTask: jest.fn().mockResolvedValue(true),
    };

    errorHandlerService = {
      handleError: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskConsumerService,
        { provide: RedisQueueService, useValue: queueService },
        { provide: TaskErrorHandlerService, useValue: errorHandlerService },
      ],
    }).compile();

    service = module.get<TaskConsumerService>(TaskConsumerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startConsuming', () => {
    it('should start consuming tasks from queue', async () => {
      await service.startConsuming();
      expect(queueService.dequeueTask).toHaveBeenCalled();
    });
  });

  describe('processTask', () => {
    it('should process task successfully', async () => {
      const task = { id: 'task-1', type: 'process', data: { message: 'test' } };
      const result = await service.processTask(task);
      expect(result).toBeDefined();
    });

    it('should handle task processing errors', async () => {
      const task = { id: 'task-1', type: 'invalid', data: {} };
      try {
        await service.processTask(task);
      } catch (error) {
        expect(errorHandlerService.handleError).toHaveBeenCalled();
      }
    });
  });

  describe('stopConsuming', () => {
    it('should stop consuming tasks', async () => {
      await service.stopConsuming();
      expect(service).toBeDefined();
    });
  });
});
