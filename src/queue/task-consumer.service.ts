/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisQueueService, QueueJobData } from './redis-queue.service';
import { Job } from 'bullmq';

export interface TaskPayload {
  taskId: string;
  type: string;
  data: any;
  priority?: number;
  retries?: number;
}

@Injectable()
export class TaskConsumerService implements OnModuleInit {
  private readonly queueName = 'tasks';
  private readonly maxConcurrency = 5;

  constructor(private redisQueueService: RedisQueueService) {}

  async onModuleInit() {
    await this.initializeConsumer();
  }

  async initializeConsumer() {
    await this.redisQueueService.processQueue(
      this.queueName,
      this.processTask.bind(this),
    );
  }

  async submitTask(payload: TaskPayload): Promise<string> {
    const jobData: QueueJobData = {
      id: payload.taskId,
      type: payload.type,
      payload: payload.data,
      priority: payload.priority || 0,
      retries: payload.retries || 3,
    };
    const job = await this.redisQueueService.addJob(
      this.queueName,
      jobData,
    );
    return job.id as string;
  }

  private async processTask(job: Job): Promise<void> {
    try {
      console.log(`Processing task: ${job.id}`);

      // Task type routing
      const result = await this.handleTaskByType(
        job.data.type,
        job.data.payload,
      );
      console.log(`Task ${job.id} completed successfully`, result);
    } catch (error) {
      console.error(`Task ${job.id} processing failed:`, error);
      throw error;
    }
  }

  private async handleTaskByType(
    type: string,
    payload: any,
  ): Promise<any> {
    switch (type) {
      case 'browser_automation':
        return await this.handleBrowserAutomation(payload);
      case 'data_extraction':
        return await this.handleDataExtraction(payload);
      case 'report_generation':
        return await this.handleReportGeneration(payload);
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
  }

  private async handleBrowserAutomation(payload: any): Promise<any> {
    // Implementation will be in browser automation service
    return { status: 'completed', type: 'browser_automation' };
  }

  private async handleDataExtraction(payload: any): Promise<any> {
    // Implementation will be in data extraction service
    return { status: 'completed', type: 'data_extraction' };
  }

  private async handleReportGeneration(payload: any): Promise<any> {
    // Implementation will be in report service
    return { status: 'completed', type: 'report_generation' };
  }

  async getTaskStatus(taskId: string): Promise<any> {
    const job = await this.redisQueueService.getJob(
      this.queueName,
      taskId,
    );
    if (!job) {
      return null;
    }
    return {
      id: job.id,
      state: await job.getState(),
      progress: job.progress,
      data: job.data,
    };
  }
}
