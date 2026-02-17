import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { TasksService } from './tasks.service';
import axios from 'axios';

@Processor('tasks')
export class TasksProcessor {
  private readonly logger = new Logger(TasksProcessor.name);
  private readonly ollamaUrl = 'http://arq-ollama:11434/api/generate';

  constructor(private readonly tasksService: TasksService) {}

  @Process('generate-plan')
  async handleTask(job: Job) {
    const { taskId, description } = job.data;
    this.logger.log(`[Worker] Processing task ${taskId}`);
    try {
      const response = await axios.post(this.ollamaUrl, {
        model: 'gemma2:2b',
        prompt: `Create a short step-by-step action plan for: ${description}`,
        stream: false,
      }, { timeout: 120000 });

      await this.tasksService.update(taskId, {
        status: 'completed',
        description: response.data?.response || 'Done'
      });
      this.logger.log(`[Worker] Task ${taskId} completed`);
    } catch (e) {
      this.logger.error(`[Worker] Failed: ${e.message}`);
      await this.tasksService.update(taskId, { status: 'failed' });
    }
  }
}
