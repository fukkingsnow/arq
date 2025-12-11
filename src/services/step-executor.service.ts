import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { WorkflowStep } from '../entities/workflow-step.entity';
import { WorkflowExecution } from '../entities/workflow-execution.entity';

@Injectable()
export class StepExecutorService {
  private readonly logger = new Logger(StepExecutorService.name);

  /**
   * Execute a single workflow step
   */
  async executeStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<WorkflowStep> {
    try {
      this.logger.log(`Executing step ${step.id} of type ${step.type}`);

      // Mark step as running
      step.status = 'running';
      const startTime = Date.now();

      // Execute based on step type
      let output: Record<string, any> = {};
      switch (step.type) {
        case 'action':
          output = await this.executeAction(step, execution);
          break;
        case 'condition':
          output = await this.evaluateCondition(step, execution);
          break;
        case 'loop':
          output = await this.executeLoop(step, execution);
          break;
        case 'wait':
          output = await this.executeWait(step, execution);
          break;
        default:
          throw new BadRequestException(`Unknown step type: ${step.type}`);
      }

      // Mark step as completed
      step.status = 'completed';
      step.output = output;
      step.executionTime = Date.now() - startTime;
      this.logger.log(`Step ${step.id} completed in ${step.executionTime}ms`);

      return step;
    } catch (error) {
      this.logger.error(`Step execution failed: ${error.message}`);
      step.status = 'failed';
      step.errorMessage = error.message;
      throw error;
    }
  }

  private async executeAction(
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<Record<string, any>> {
    // Placeholder for action execution
    return { success: true, timestamp: Date.now() };
  }

  private async evaluateCondition(
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<Record<string, any>> {
    // Placeholder for condition evaluation
    return { result: true };
  }

  private async executeLoop(
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<Record<string, any>> {
    // Placeholder for loop execution
    return { iterations: 0 };
  }

  private async executeWait(
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<Record<string, any>> {
    const duration = step.config?.duration || 1000;
    await new Promise((resolve) => setTimeout(resolve, duration));
    return { waited: duration };
  }

  /**
   * Retry failed step
   */
  async retryStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<WorkflowStep> {
    if (step.retryCount >= step.maxRetries) {
      throw new BadRequestException('Max retries exceeded');
    }
    step.retryCount++;
    return this.executeStep(step, execution);
  }

  /**
   * Skip a step
   */
  skipStep(step: WorkflowStep): WorkflowStep {
    step.status = 'skipped';
    step.output = { skipped: true, reason: 'Manually skipped' };
    return step;
  }
}
