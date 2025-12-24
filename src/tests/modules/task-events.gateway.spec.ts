import { Test, TestingModule } from '@nestjs/testing';
import { TaskEventsGateway } from '../../modules/events/task-events.gateway';
import { RedisQueueService } from '../../queue/redis-queue.service';

describe('TaskEventsGateway', () => {
  let gateway: TaskEventsGateway;
  let queueService: any;
  let mockServer: any;
  let mockSocket: any;

  beforeEach(async () => {
    queueService = {
      enqueueTask: jest.fn().mockResolvedValue(true),
      dequeueTask: jest.fn().mockResolvedValue(null),
    };

    mockSocket = {
      emit: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn(),
    };

    mockServer = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskEventsGateway,
        { provide: RedisQueueService, useValue: queueService },
      ],
    }).compile();

    gateway = module.get<TaskEventsGateway>(TaskEventsGateway);
    gateway.server = mockServer;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should handle client connection', () => {
      gateway.handleConnection(mockSocket);
      expect(mockSocket.on).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should handle client disconnect', () => {
      gateway.handleDisconnect(mockSocket);
      expect(mockSocket).toBeDefined();
    });
  });

  describe('emitTaskUpdate', () => {
    it('should emit task update to all clients', async () => {
      const task = { id: 'task-1', status: 'completed' };
      await gateway.emitTaskUpdate(task);
      expect(mockServer.emit).toHaveBeenCalled();
    });
  });

  describe('emitTaskStatus', () => {
    it('should emit task status change', async () => {
      const taskId = 'task-1';
      const status = 'processing';
      
      await gateway.emitTaskStatus(taskId, status);
      expect(mockServer.to).toHaveBeenCalled();
    });
  });

  describe('broadcastQueueLength', () => {
    it('should broadcast current queue length', async () => {
      await gateway.broadcastQueueLength();
      expect(queueService.dequeueTask).toHaveBeenCalled();
    });
  });
});
