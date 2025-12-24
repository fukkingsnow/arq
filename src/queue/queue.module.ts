import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisQueueService } from './redis-queue.service';

@Module({
  imports: [ConfigModule],
  providers: [RedisQueueService],
  exports: [RedisQueueService],
})
export class QueueModule {}
