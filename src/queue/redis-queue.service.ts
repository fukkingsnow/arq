/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Queue, Job } from 'bullmq';
import Redis from 'ioredis';

export interface QueueConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface QueueJobData {
  id: string;
  type: string;
  payload: any;
  priority?: number;
  retries?: number;
}

@Injectable()
export class RedisQueueService {
  private redis: Redis;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const config = this.getQueueConfig();
    this.redis = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0,
      maxRetriesPerRequest: null,
    });
    this.redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }

  private getQueueConfig(): QueueConfig {
    return {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
    };
  }

  getQueue(queueName: string): Queue {
    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: this.redis,
      });
      this.queues.set(queueName, queue);
    }
    return this.queues.get(queueName)!;
  }

  async addJob(
    queueName: string,
    jobData: QueueJobData,
  ): Promise<Job> {
    const queue = this.getQueue(queueName);
    const job = await queue.add(jobData.type, jobData.payload, {
      jobId: jobData.id,
      priority: jobData.priority || 0,
      attempts: jobData.retries || 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
    return job;
  }

  async processQueue(
    queueName: string,
    processor: (job: Job) => Promise<any>,
  ): Promise<void> {
    if (this.workers.has(queueName)) {
      return;
    }
    const worker = new Worker(queueName, processor, {
      connection: this.redis,
      concurrency: 5,
    });
    worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed`);
    });
    worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
    });
    this.workers.set(queueName, worker);
  }

  async getJob(queueName: string, jobId: string): Promise<Job | undefined> {
    const queue = this.getQueue(queueName);
    return await queue.getJob(jobId);
  }

  async removeJob(queueName: string, jobId: string): Promise<boolean> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
      return true;
    }
    return false;
  }

  async getQueueStats(queueName: string) {
    const queue = this.getQueue(queueName);
    return await queue.getMetrics('health');
  }

  async onModuleDestroy() {
    for (const worker of this.workers.values()) {
      await worker.close();
    }
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
