import { Test, TestingModule } from '@nestjs/testing';
import { TaskErrorHandlerService } from '../../services/task-error-handler.service';
import { Logger } from '@nestjs/common';

describe('TaskErrorHandlerService', () => {
  let service: TaskErrorHandlerService;
  let mockLogger: any;

  beforeEach(async () => {
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskErrorHandlerService,
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<TaskErrorHandlerService>(TaskErrorHandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleError', () => {
    it('should handle task error', async () => {
      const error = new Error('Task processing failed');
      const task = { id: 'task-1', type: 'process', data: {} };
      
      await service.handleError(task, error);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should retry failed task', async () => {
      const error = new Error('Task processing failed');
      const task = { id: 'task-1', type: 'process', retries: 0, maxRetries: 3 };
      
      const result = await service.handleError(task, error);
      expect(result).toBeDefined();
    });
  });

  describe('logError', () => {
    it('should log error details', async () => {
      const error = new Error('Test error');
      const context = 'TaskProcessing';
      
      await service.logError(error, context);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error'),
        expect.any(String)
      );
    });
  });

  describe('isRetryable', () => {
    it('should determine if error is retryable', () => {
      const retryableError = new Error('Network timeout');
      const nonRetryableError = new Error('Invalid task');
      
      const result1 = service.isRetryable(retryableError);
      const result2 = service.isRetryable(nonRetryableError);
      
      expect(typeof result1).toBe('boolean');
      expect(typeof result2).toBe('boolean');
    });
  });
});
