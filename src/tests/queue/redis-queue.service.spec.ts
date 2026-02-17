import { Test, TestingModule } from '@nestjs/testing';
import { RedisQueueService } from '../../queue/redis-queue.service';
import * as redis from 'redis';

jest.mock('redis');

describe('RedisQueueService', () => {
  let service: RedisQueueService;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      lpush: jest.fn().mockResolvedValue(1),
      rpop: jest.fn().mockResolvedValue(JSON.stringify({ id: 'task-1' })),
      lrange: jest.fn().mockResolvedValue([]),
      llen: jest.fn().mockResolvedValue(0),
      ping: jest.fn().mockResolvedValue('PONG'),
    };

    (redis.createClient as jest.Mock).mockReturnValue(mockClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisQueueService],
    }).compile();

    service = module.get<RedisQueueService>(RedisQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enqueueTask', () => {
    it('should add task to queue', async () => {
      const task = { id: 'task-1', type: 'process', data: {} };
      await service.enqueueTask(task);
      expect(mockClient.lpush).toHaveBeenCalled();
    });
  });

  describe('dequeueTask', () => {
    it('should retrieve task from queue', async () => {
      const result = await service.dequeueTask();
      expect(mockClient.rpop).toHaveBeenCalled();
    });
  });

  describe('getQueueLength', () => {
    it('should return queue length', async () => {
      const length = await service.getQueueLength();
      expect(mockClient.llen).toHaveBeenCalled();
      expect(typeof length).toBe('number');
    });
  });
});
